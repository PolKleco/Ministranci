import UIKit
import WebKit
import StoreKit

final class MinistranciWebViewController: UIViewController, WKNavigationDelegate {
    private let appBaseURL = "https://www.ministranci.net/app"
    private let appPlatform = "ios-app"
    private let appVersionCode = "1"
    private let checkoutScheme = "ministranci-ios-billing"
    private let checkoutHost = "checkout"

    private lazy var webView: WKWebView = {
        let config = WKWebViewConfiguration()
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = self
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        loadAppHome()
    }

    private func loadAppHome() {
        guard let url = makeAppURL(fragmentItems: nil) else { return }
        webView.load(URLRequest(url: url))
    }

    private func makeAppURL(fragmentItems: [URLQueryItem]?) -> URL? {
        var comps = URLComponents(string: appBaseURL)
        comps?.queryItems = [
            URLQueryItem(name: "app_platform", value: appPlatform),
            URLQueryItem(name: "app_vc", value: appVersionCode)
        ]
        if let fragmentItems, !fragmentItems.isEmpty {
            var hashComps = URLComponents()
            hashComps.queryItems = fragmentItems
            comps?.fragment = hashComps.percentEncodedQuery
        }
        return comps?.url
    }

    private func openInWeb(parafiaId: String, status: String, productId: String? = nil, transactionId: String? = nil, originalTransactionId: String? = nil, error: String? = nil) {
        var hashItems: [URLQueryItem] = [
            URLQueryItem(name: "ap_purchase_status", value: status),
            URLQueryItem(name: "ap_parafia_id", value: parafiaId)
        ]
        if let productId, !productId.isEmpty {
            hashItems.append(URLQueryItem(name: "ap_product_id", value: productId))
        }
        if let transactionId, !transactionId.isEmpty {
            hashItems.append(URLQueryItem(name: "ap_transaction_id", value: transactionId))
        }
        if let originalTransactionId, !originalTransactionId.isEmpty {
            hashItems.append(URLQueryItem(name: "ap_original_transaction_id", value: originalTransactionId))
        }
        if let error, !error.isEmpty {
            hashItems.append(URLQueryItem(name: "ap_error", value: error))
        }
        guard let url = makeAppURL(fragmentItems: hashItems) else { return }
        webView.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        if url.scheme == checkoutScheme, url.host == checkoutHost {
            decisionHandler(.cancel)
            let comps = URLComponents(url: url, resolvingAgainstBaseURL: false)
            let parafiaId = comps?.queryItems?.first(where: { $0.name == "parafiaId" })?.value ?? ""
            let productId = comps?.queryItems?.first(where: { $0.name == "productId" })?.value ?? ""

            if parafiaId.isEmpty {
                openInWeb(parafiaId: "", status: "error", error: "missing_parafia_id")
                return
            }
            if productId.isEmpty {
                openInWeb(parafiaId: parafiaId, status: "error", error: "product_not_found")
                return
            }

            Task {
                await startCheckout(parafiaId: parafiaId, productId: productId)
            }
            return
        }

        decisionHandler(.allow)
    }

    @MainActor
    private func startCheckout(parafiaId: String, productId: String) async {
        guard #available(iOS 15.0, *) else {
            openInWeb(parafiaId: parafiaId, status: "error", productId: productId, error: "ios_version_unsupported")
            return
        }

        do {
            let products = try await Product.products(for: [productId])
            guard let product = products.first else {
                openInWeb(parafiaId: parafiaId, status: "error", productId: productId, error: "product_not_found")
                return
            }

            let result = try await product.purchase()
            switch result {
            case .pending:
                openInWeb(parafiaId: parafiaId, status: "pending", productId: productId)

            case .userCancelled:
                openInWeb(parafiaId: parafiaId, status: "canceled", productId: productId)

            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    await transaction.finish()
                    openInWeb(
                        parafiaId: parafiaId,
                        status: "success",
                        productId: productId,
                        transactionId: String(transaction.id),
                        originalTransactionId: String(transaction.originalID)
                    )
                case .unverified:
                    openInWeb(parafiaId: parafiaId, status: "error", productId: productId, error: "unverified_transaction")
                }

            @unknown default:
                openInWeb(parafiaId: parafiaId, status: "error", productId: productId, error: "unknown_purchase_result")
            }
        } catch {
            openInWeb(parafiaId: parafiaId, status: "error", productId: productId, error: "purchase_failed")
        }
    }
}
