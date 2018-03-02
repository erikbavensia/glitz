import { Style } from '@glitz/type';
import GlitzClient from './GlitzClient';

interface TestStyle extends Style {
  '@media (min-width: 100px)'?: Style;
  '@media (min-width: 200px)'?: Style;
  '@media (min-width: 1000px)'?: Style;
  '@media (min-width: 768px)'?: Style;
  '@media (min-width: 992px)'?: Style;
}

beforeEach(() => {
  document.head.innerHTML = '';
});

describe('client', () => {
  it('injects plain rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ color: 'red' })).toBe('a');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
  });
  it('injects shorthand rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(
      client.injectStyle({
        padding: { left: '10px', right: '10px', top: '10px', bottom: '10px' },
      }),
    ).toBe('a b c d');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(4);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();
    expect(sheet.cssRules[2].cssText).toMatchSnapshot();
    expect(sheet.cssRules[3].cssText).toMatchSnapshot();

    expect(
      client.injectStyle({
        margin: { x: '10px' },
      }),
    ).toBe('e f');

    expect(sheet.cssRules).toHaveLength(6);
    expect(sheet.cssRules[4].cssText).toMatchSnapshot();
    expect(sheet.cssRules[5].cssText).toMatchSnapshot();

    expect(
      client.injectStyle({
        margin: { y: '10px' },
      }),
    ).toBe('g h');

    expect(sheet.cssRules).toHaveLength(8);
    expect(sheet.cssRules[6].cssText).toMatchSnapshot();
    expect(sheet.cssRules[7].cssText).toMatchSnapshot();
  });
  it('injects pseudo rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ color: 'red' })).toBe('a');
    expect(client.injectStyle({ ':hover': { color: 'red' } })).toBe('b');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(2);
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();
  });
  it('injects nested pseudo rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ ':first-child': { ':hover': { color: 'red' } } })).toBe('a');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
  });
  it('injects media rule', () => {
    const style = createStyle();
    const media = createStyle('(min-width: 768px)');
    const client = new GlitzClient<TestStyle>([style, media]);

    expect(client.injectStyle({ color: 'red' })).toBe('a');
    expect(client.injectStyle({ ':hover': { color: 'red' } })).toBe('b');
    expect(client.injectStyle({ '@media (min-width: 768px)': { color: 'red' } })).toBe('c');
    expect(client.injectStyle({ '@media (min-width: 768px)': { ':hover': { color: 'red' } } })).toBe('d');

    const sheet = style.sheet as CSSStyleSheet;
    const mediaSheet = media.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(2);
    expect(mediaSheet.cssRules).toHaveLength(2);
    expect(mediaSheet.cssRules[0].cssText).toMatchSnapshot();
  });
  it('injects media elements in certain order', () => {
    const order = ['(min-width: 100px)', '(min-width: 200px)', '(min-width: 1000px)'];
    const client = new GlitzClient<TestStyle>(null, {
      mediaOrder: (a: string, b: string) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        return indexA - indexB;
      },
    });

    expect(client.injectStyle({ '@media (min-width: 1000px)': { color: 'red' } })).toBe('a');
    expect(client.injectStyle({ '@media (min-width: 100px)': { color: 'red' } })).toBe('b');

    expect(document.head.childNodes).toHaveLength(2);
    expect((document.head.childNodes[0] as HTMLStyleElement).media).toBe('(min-width: 100px)');
    expect((document.head.childNodes[1] as HTMLStyleElement).media).toBe('(min-width: 1000px)');

    expect(client.injectStyle({ '@media (min-width: 200px)': { color: 'red' } })).toBe('c');

    expect(document.head.childNodes).toHaveLength(3);
    expect((document.head.childNodes[0] as HTMLStyleElement).media).toBe('(min-width: 100px)');
    expect((document.head.childNodes[1] as HTMLStyleElement).media).toBe('(min-width: 200px)');
    expect((document.head.childNodes[2] as HTMLStyleElement).media).toBe('(min-width: 1000px)');

    expect(client.injectStyle({ '@media (min-width: 1000px)': { color: 'red' } })).toBe('a');
    expect(client.injectStyle({ color: 'red' })).toBe('d');

    expect(document.head.childNodes).toHaveLength(4);
    expect((document.head.childNodes[0] as HTMLStyleElement).media).toBe('');
    expect((document.head.childNodes[1] as HTMLStyleElement).media).toBe('(min-width: 100px)');
    expect((document.head.childNodes[2] as HTMLStyleElement).media).toBe('(min-width: 200px)');
    expect((document.head.childNodes[3] as HTMLStyleElement).media).toBe('(min-width: 1000px)');
  });
  it('cache declarations', () => {
    let count = 0;
    const client = new GlitzClient<TestStyle>(null, {
      transformer: declaration => {
        count++;
        return declaration;
      },
    });

    expect(client.injectStyle({ color: 'red' })).toBe('a');
    expect(client.injectStyle({ color: 'red' })).toBe('a');
    expect(count).toBe(1);
    expect(client.injectStyle({ ':hover': { color: 'red' } })).toBe('b');
    expect(client.injectStyle({ ':hover': { color: 'red' } })).toBe('b');
    expect(count).toBe(2);
    expect(client.injectStyle({ '@media (min-width: 768px)': { color: 'red' } })).toBe('c');
    expect(client.injectStyle({ '@media (min-width: 768px)': { color: 'red' } })).toBe('c');
    expect(count).toBe(3);
    expect(client.injectStyle({ '@media (min-width: 768px)': { ':hover': { color: 'red' } } })).toBe('d');
    expect(client.injectStyle({ '@media (min-width: 768px)': { ':hover': { color: 'red' } } })).toBe('d');
    expect(count).toBe(4);
  });
  it('injects atomic rules', () => {
    const style = createStyle();
    const media = createStyle('(min-width: 768px)');
    const client = new GlitzClient<TestStyle>([style, media]);
    const sheet = style.sheet as CSSStyleSheet;
    const mediaSheet = media.sheet as CSSStyleSheet;

    expect(
      client.injectStyle({
        color: 'red',
        background: { color: 'green' },
        borderColor: 'blue',
        ':hover': { color: 'red', background: { color: 'green' }, borderColor: 'blue' },
        '@media (min-width: 768px)': { color: 'red', background: { color: 'green' }, borderColor: 'blue' },
      }),
    ).toBe('a b c d e f g h i');

    expect(sheet.cssRules).toHaveLength(6);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();
    expect(sheet.cssRules[2].cssText).toMatchSnapshot();
    expect(sheet.cssRules[3].cssText).toMatchSnapshot();
    expect(sheet.cssRules[4].cssText).toMatchSnapshot();
    expect(sheet.cssRules[5].cssText).toMatchSnapshot();

    expect(mediaSheet.cssRules).toHaveLength(3);
    expect(mediaSheet.cssRules[0].cssText).toMatchSnapshot();
    expect(mediaSheet.cssRules[1].cssText).toMatchSnapshot();
    expect(mediaSheet.cssRules[2].cssText).toMatchSnapshot();
  });
  it('injects non-atomic rules', () => {
    const style = createStyle();
    const media = createStyle('(min-width: 768px)');
    const client = new GlitzClient<TestStyle>([style, media], { atomic: false });
    const sheet = style.sheet as CSSStyleSheet;
    const mediaSheet = media.sheet as CSSStyleSheet;

    expect(
      client.injectStyle({
        color: 'red',
        background: { color: 'green' },
        borderColor: 'blue',
        ':hover': { color: 'red', background: { color: 'green' }, borderColor: 'blue' },
        '@media (min-width: 768px)': { color: 'red', background: { color: 'green' }, borderColor: 'blue' },
      }),
    ).toBe('a b c');

    expect(sheet.cssRules).toHaveLength(2);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();

    expect(mediaSheet.cssRules).toHaveLength(1);
    expect(mediaSheet.cssRules[0].cssText).toMatchSnapshot();
  });
  it('injects keyframes rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ '@keyframes': { from: { color: 'red' }, to: { color: 'green' } } })).toBe('a');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(2);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();

    expect(client.injectStyle({ animationName: { from: { color: 'blue' }, to: { color: 'white' } } })).toBe('b');

    expect(sheet.cssRules).toHaveLength(4);
    expect(sheet.cssRules[2].cssText).toMatchSnapshot();
    expect(sheet.cssRules[3].cssText).toMatchSnapshot();

    expect(client.injectStyle({ animation: { name: { from: { color: 'blue' }, to: { color: 'white' } } } })).toBe('b');
  });
  it('injects font face rule', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style]);

    expect(
      client.injectStyle({
        '@font-face': {
          fontStyle: 'normal',
          fontWeight: 400,
          src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTtgPs.woff2) format('woff2')",
        },
      }),
    ).toBe('a');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(2);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();

    expect(
      client.injectStyle({
        fontFamily: {
          fontStyle: 'normal',
          fontWeight: 400,
          src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
        },
      }),
    ).toBe('b');

    expect(
      client.injectStyle({
        font: {
          family: {
            fontStyle: 'normal',
            fontWeight: 400,
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
          },
        },
      }),
    ).toBe('b');

    expect(sheet.cssRules).toHaveLength(4);
    expect(sheet.cssRules[2].cssText).toMatchSnapshot();
    expect(sheet.cssRules[3].cssText).toMatchSnapshot();

    expect(
      client.injectStyle({
        fontFamily: [
          {
            fontStyle: 'normal',
            fontWeight: 400,
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
          },
          'sans-serif',
        ],
      }),
    ).toBe('c');

    expect(
      client.injectStyle({
        font: {
          family: [
            {
              fontStyle: 'normal',
              fontWeight: 400,
              src:
                "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
            },
            'sans-serif',
          ],
        },
      }),
    ).toBe('c');

    expect(sheet.cssRules).toHaveLength(5);
    expect(sheet.cssRules[4].cssText).toMatchSnapshot();
  });
  it('injects different combinations', () => {
    const style1 = createStyle();
    const style2 = createStyle('(min-width: 768px)');
    const style3 = createStyle('(min-width: 992px)');
    const client = new GlitzClient<TestStyle>([style1, style2, style3]);

    expect(
      client.injectStyle({
        color: 'red',
        '@media (min-width: 768px)': { color: 'green' },
        '@media (min-width: 992px)': { color: 'blue' },
      }),
    ).toBe('a b c');

    const sheet1 = style1.sheet as CSSStyleSheet;

    expect(sheet1.cssRules).toHaveLength(1);
    expect(sheet1.cssRules[0].cssText).toMatchSnapshot();

    const sheet2 = style2.sheet as CSSStyleSheet;

    expect(sheet2.cssRules).toHaveLength(1);
    expect(sheet2.cssRules[0].cssText).toMatchSnapshot();

    const sheet3 = style3.sheet as CSSStyleSheet;

    expect(sheet3.cssRules).toHaveLength(1);
    expect(sheet3.cssRules[0].cssText).toMatchSnapshot();
  });
  it('injects rule deeply', () => {
    const style = createStyle();
    const media = createStyle('(min-width: 768px)');
    const client = new GlitzClient<TestStyle>([style, media]);
    const sheet = style.sheet as CSSStyleSheet;

    expect(client.injectStyle([{ color: 'green' }, { color: 'red' }])).toBe('a');

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();

    expect(
      client.injectStyle([
        {
          padding: { left: '10px' },
        },
        {
          paddingLeft: '20px',
        },
      ]),
    ).toBe('b');

    expect(sheet.cssRules).toHaveLength(2);
    expect(sheet.cssRules[1].cssText).toMatchSnapshot();

    expect(client.injectStyle([{ ':hover': { color: 'green' } }, { ':hover': { color: 'red' } }])).toBe('c');
    expect(
      client.injectStyle([
        { ':first-child': { ':hover': { color: 'green' } } },
        { ':first-child': { ':hover': { color: 'red' } } },
      ]),
    ).toBe('d');

    expect(sheet.cssRules).toHaveLength(4);
    expect(sheet.cssRules[2].cssText).toMatchSnapshot();
    expect(sheet.cssRules[3].cssText).toMatchSnapshot();

    expect(
      client.injectStyle([
        { '@keyframes': { from: { color: 'red' }, to: { color: 'green' } } },
        { '@keyframes': { from: { color: 'green' }, to: { color: 'blue' } } },
      ]),
    ).toBe('e');
    expect(
      client.injectStyle([
        { animationName: { from: { color: 'blue' }, to: { color: 'white' } } },
        { animationName: { from: { color: 'white' }, to: { color: 'black' } } },
      ]),
    ).toBe('f');

    expect(sheet.cssRules).toHaveLength(8);
    expect(sheet.cssRules[4].cssText).toMatchSnapshot();
    expect(sheet.cssRules[5].cssText).toMatchSnapshot();
    expect(sheet.cssRules[6].cssText).toMatchSnapshot();
    expect(sheet.cssRules[7].cssText).toMatchSnapshot();

    expect(
      client.injectStyle([
        {
          '@font-face': {
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTtgPs.woff2) format('woff2')",
          },
        },
        {
          '@font-face': {
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
          },
        },
      ]),
    ).toBe('g');
    expect(
      client.injectStyle([
        {
          '@font-face': {
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
          },
        },
        {
          '@font-face': {
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTtgPs.woff2) format('woff2')",
          },
        },
      ]),
    ).toBe('h');

    expect(sheet.cssRules).toHaveLength(12);
    expect(sheet.cssRules[8].cssText).toMatchSnapshot();
    expect(sheet.cssRules[9].cssText).toMatchSnapshot();
    expect(sheet.cssRules[10].cssText).toMatchSnapshot();
    expect(sheet.cssRules[11].cssText).toMatchSnapshot();

    const mediaSheet = media.sheet as CSSStyleSheet;

    expect(
      client.injectStyle([
        { '@media (min-width: 768px)': { color: 'green' } },
        { '@media (min-width: 768px)': { color: 'red' } },
      ]),
    ).toBe('i');
    expect(
      client.injectStyle([
        { '@media (min-width: 768px)': { ':hover': { color: 'green' } } },
        { '@media (min-width: 768px)': { ':hover': { color: 'red' } } },
      ]),
    ).toBe('j');

    expect(mediaSheet.cssRules).toHaveLength(2);
    expect(mediaSheet.cssRules[0].cssText).toMatchSnapshot();
    expect(mediaSheet.cssRules[1].cssText).toMatchSnapshot();
  });
  it('hydrates plain rule', () => {
    const style = createStyle(null, '.a{color:red}.b{color:green}');
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ color: 'green' })).toBe('b');
  });
  it('hydrates media rule', () => {
    const style = createStyle(null, '.a{color:red}.b:hover{color:green}');
    const media = createStyle('(min-width: 768px)', '.c{color:blue}.d:hover{color:white}');
    const client = new GlitzClient<TestStyle>([style, media]);

    expect(client.injectStyle({ '@media (min-width: 768px)': { color: 'blue', ':hover': { color: 'white' } } })).toBe(
      'c d',
    );
  });
  it('hydrates keyframes rule', () => {
    const style = createStyle(
      null,
      '.a{animation-name:a}.b{animation-name:b}@keyframes a{from{color:red}to{color:green}}@keyframes b{from{color:blue}to{color:white}}',
    );
    const client = new GlitzClient<TestStyle>([style]);

    expect(client.injectStyle({ '@keyframes': { from: { color: 'blue' }, to: { color: 'white' } } })).toBe('b');
    expect(client.injectStyle({ animationName: { from: { color: 'blue' }, to: { color: 'white' } } })).toBe('b');
    expect(client.injectStyle({ animation: { name: { from: { color: 'blue' }, to: { color: 'white' } } } })).toBe('b');
  });
  it('hydrates font face rule', () => {
    const style = createStyle(
      null,
      '.a{font-family:a}.b{font-family:b}.c{font-family:b,sans-serif}' +
        "@font-face {font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTtgPs.woff2) format('woff2');font-family:a}" +
        "@font-face {font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2');font-family:b}",
    );
    const client = new GlitzClient<TestStyle>([style]);

    expect(
      client.injectStyle({
        '@font-face': {
          fontStyle: 'normal',
          fontWeight: 400,
          src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
        },
      }),
    ).toBe('b');
    expect(
      client.injectStyle({
        fontFamily: {
          fontStyle: 'normal',
          fontWeight: 400,
          src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
        },
      }),
    ).toBe('b');
    expect(
      client.injectStyle({
        fontFamily: [
          {
            fontStyle: 'normal',
            fontWeight: 400,
            src: "url(https://fonts.gstatic.com/s/paytoneone/v10/0nksC9P7MfYHj2oFtYm2ChTjgPvNiA.woff2) format('woff2')",
          },
          'sans-serif',
        ],
      }),
    ).toBe('c');
  });
  it('hydrates multiple different combinations', () => {
    const style1 = createStyle(null, '.a{color:red}');
    const style2 = createStyle('(min-width: 768px)', '.b{color:green}');
    const style3 = createStyle('(min-width: 992px)', '.c{color:blue}');
    const client = new GlitzClient<TestStyle>([style1, style2, style3]);

    expect(
      client.injectStyle({
        color: 'red',
        '@media (min-width: 768px)': { color: 'green' },
        '@media (min-width: 992px)': { color: 'blue' },
      }),
    ).toBe('a b c');
  });
  it('applies transformer', () => {
    const style = createStyle();
    const client = new GlitzClient<TestStyle>([style], {
      transformer: properties => ({ ...properties, mozAppearance: 'none' }),
    });

    expect(client.injectStyle({ appearance: 'none' })).toBe('a');

    const sheet = style.sheet as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toMatchSnapshot();
  });
  it('warns with mixed longhand and shorthand', () => {
    const client = new GlitzClient<TestStyle>();
    const error = (console.error = jest.fn());
    const warn = (console.warn = jest.fn());

    client.injectStyle({ border: { width: 0 }, borderWidth: 0 });
    expect(error).toHaveBeenCalledTimes(0);
    expect(warn).toHaveBeenCalledTimes(1);

    client.injectStyle({ ':hover': { border: 0 }, borderWidth: 0 } as TestStyle);
    expect(error).toHaveBeenCalledTimes(0);

    client.injectStyle({ border: 0, borderWidth: 0 } as TestStyle);
    expect(error).toHaveBeenCalledTimes(1);

    client.injectStyle([{ border: 0 }, { borderWidth: 0 }] as TestStyle[]);
    expect(error).toHaveBeenCalledTimes(2);

    client.injectStyle({ ':hover': { border: 0, borderWidth: 0 } } as TestStyle);
    expect(error).toHaveBeenCalledTimes(3);
  });
});

function createStyle(media?: string | null, css?: string) {
  const element = document.createElement('style');
  document.head.appendChild(element);

  if (media) {
    element.media = media;
  }

  if (css) {
    element.appendChild(document.createTextNode(css));
  }

  return element;
}
