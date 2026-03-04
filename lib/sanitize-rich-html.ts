const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4',
  'blockquote', 'code', 'pre',
  'span', 'div',
  'a', 'img', 'iframe',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'title', 'style', 'data-float', 'data-width', 'data-youtube-video']),
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  iframe: new Set(['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder']),
  div: new Set(['data-youtube-video', 'data-width', 'data-float', 'style', 'class']),
  span: new Set(['style', 'class']),
};

const ALLOWED_STYLE_PROPS = new Set([
  'width',
  'max-width',
  'height',
  'float',
  'margin',
  'display',
  'text-align',
  'aspect-ratio',
]);

function isSafeUrl(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (v.startsWith('http://') || v.startsWith('https://')) return true;
  if (v.startsWith('/')) return true;
  if (v.startsWith('./') || v.startsWith('../')) return true;
  if (v.startsWith('blob:')) return true;
  return false;
}

function isSafeIframeSrc(value: string) {
  const v = value.trim().toLowerCase();
  return (
    v.startsWith('https://www.youtube.com/') ||
    v.startsWith('https://youtube.com/') ||
    v.startsWith('https://www.youtube-nocookie.com/') ||
    v.startsWith('https://youtu.be/')
  );
}

function sanitizeStyle(styleValue: string) {
  const safeParts: string[] = [];
  const rules = styleValue.split(';');
  for (const rule of rules) {
    const [rawProp, rawVal] = rule.split(':');
    if (!rawProp || !rawVal) continue;
    const prop = rawProp.trim().toLowerCase();
    const val = rawVal.trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    if (/url\s*\(/i.test(val)) continue;
    safeParts.push(`${prop}: ${val}`);
  }
  return safeParts.join('; ');
}

export function sanitizeRichHtml(input: string): string {
  if (!input) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }

      const allowedForTag = ALLOWED_ATTRS[tag] || new Set<string>();
      const allowedGlobal = ALLOWED_ATTRS['*'];
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (!allowedForTag.has(name) && !allowedGlobal.has(name)) {
          el.removeAttribute(attr.name);
          continue;
        }

        if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (tag === 'iframe' && name === 'src' && !isSafeIframeSrc(value)) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === 'style') {
          const cleaned = sanitizeStyle(value);
          if (cleaned) el.setAttribute('style', cleaned);
          else el.removeAttribute('style');
        }
      }

      if (tag === 'a') {
        el.setAttribute('rel', 'noopener noreferrer');
        if (el.getAttribute('target') === '_blank') {
          el.setAttribute('target', '_blank');
        } else {
          el.removeAttribute('target');
        }
      }

      if (tag === 'iframe') {
        if (!el.getAttribute('allow')) {
          el.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        }
        el.setAttribute('allowfullscreen', '');
      }
    }

    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
}
