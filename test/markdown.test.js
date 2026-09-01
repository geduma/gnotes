import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../src/utils/markdown'

describe('encabezados', () => {
  it('renderiza H1 a H6', () => {
    expect(renderMarkdown('# Uno')).toContain('<h1>Uno</h1>')
    expect(renderMarkdown('## Dos')).toContain('<h2>Dos</h2>')
    expect(renderMarkdown('### Tres')).toContain('<h3>Tres</h3>')
    expect(renderMarkdown('#### Cuatro')).toContain('<h4>Cuatro</h4>')
    expect(renderMarkdown('##### Cinco')).toContain('<h5>Cinco</h5>')
    expect(renderMarkdown('###### Seis')).toContain('<h6>Seis</h6>')
  })

  it('soporta sintaxis subrayada con = y -', () => {
    expect(renderMarkdown('Titulo\n===')).toContain('<h1>Titulo</h1>')
    expect(renderMarkdown('Subtitulo\n---')).toContain('<h2>Subtitulo</h2>')
  })
})

describe('párrafos y saltos de línea', () => {
  it('convierte saltos de línea simples en <br>', () => {
    expect(renderMarkdown('linea 1\nlinea 2')).toContain('linea 1<br>')
  })

  it('separa párrafos con líneas en blanco', () => {
    const html = renderMarkdown('párrafo uno\n\npárrafo dos')
    expect(html).toContain('<p>párrafo uno</p>')
    expect(html).toContain('<p>párrafo dos</p>')
  })
})

describe('citas', () => {
  it('renderiza cita simple', () => {
    expect(renderMarkdown('> texto citado')).toContain('<blockquote>')
    expect(renderMarkdown('> texto citado')).toContain('texto citado')
  })

  it('renderiza citas de varios párrafos', () => {
    const html = renderMarkdown('> párrafo 1\n>\n> párrafo 2')
    expect(html).toContain('párrafo 1')
    expect(html).toContain('párrafo 2')
  })

  it('renderiza citas anidadas', () => {
    const html = renderMarkdown('> principal\n>\n> > anidada')
    expect(html).toContain('anidada')
    expect(html.match(/<blockquote>/g).length).toBeGreaterThanOrEqual(1)
  })
})

describe('listas', () => {
  it('renderiza listas desordenadas', () => {
    const html = renderMarkdown('- uno\n- dos\n- tres')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>uno</li>')
    expect(html).toContain('<li>tres</li>')
  })

  it('soporta *, - y + como marcadores', () => {
    expect(renderMarkdown('* a\n- b\n+ c')).toContain('<ul>')
  })

  it('renderiza listas ordenadas', () => {
    const html = renderMarkdown('1. primero\n2. segundo')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>primero</li>')
  })

  it('no requiere numeración secuencial', () => {
    const html = renderMarkdown('1. a\n3. b\n9. c')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('<li>c</li>')
  })

  it('renderiza listas anidadas', () => {
    const html = renderMarkdown('- padre\n    - hijo\n        - nieto')
    expect(html).toContain('<li>padre')
    expect(html).toContain('<li>hijo')
    expect(html).toContain('<li>nieto')
  })

  it('combina listas ordenadas y desordenadas', () => {
    const html = renderMarkdown('1. uno\n    - a\n    - b')
    expect(html).toContain('<ol>')
    expect(html).toContain('<ul>')
  })
})

describe('códigos de bloque', () => {
  it('renderiza bloques con tres acentos graves', () => {
    const html = renderMarkdown('```\ncódigo aquí\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code>')
    expect(html).toContain('código aquí')
  })

  it('soporta lenguaje en el bloque', () => {
    const html = renderMarkdown('```js\nconst x = 1\n```')
    expect(html).toContain('language-js')
  })

  it('soporta virgulillas ~~~', () => {
    const html = renderMarkdown('~~~\ncódigo\n~~~')
    expect(html).toContain('<pre>')
  })

  it('soporta bloque preformateado con 4 espacios', () => {
    const html = renderMarkdown('    línea de código')
    expect(html).toContain('<pre>')
    expect(html).toContain('línea de código')
  })
})

describe('reglas horizontales', () => {
  it.each(['***', '---', '___', '* * *', '- - -', '_ _ _'])('renderiza %s', (input) => {
    expect(renderMarkdown(input)).toContain('<hr>')
  })
})

describe('énfasis', () => {
  it('renderiza cursiva con * y _', () => {
    expect(renderMarkdown('*cursiva*')).toContain('<em>cursiva</em>')
    expect(renderMarkdown('_cursiva_')).toContain('<em>cursiva</em>')
  })

  it('renderiza negrita con ** y __', () => {
    expect(renderMarkdown('**negrita**')).toContain('<strong>negrita</strong>')
    expect(renderMarkdown('__negrita__')).toContain('<strong>negrita</strong>')
  })

  it('combina cursiva y negrita con ***', () => {
    expect(renderMarkdown('***ambos***')).toContain('<em><strong>ambos</strong></em>')
  })

  it('no aplica énfasis con guiones dentro de la palabra', () => {
    const html = renderMarkdown('foo_bar_baz')
    expect(html).not.toContain('<em>')
  })

  it('renderiza tachado con ~~', () => {
    expect(renderMarkdown('~~tachado~~')).toContain('<s>tachado</s>')
  })
})

describe('enlaces', () => {
  it('renderiza enlaces en línea', () => {
    expect(renderMarkdown('[texto](https://ejemplo.com)')).toContain('<a href="https://ejemplo.com">texto</a>')
  })

  it('renderiza enlaces de referencia', () => {
    const html = renderMarkdown('[texto][ref]\n\n[ref]: https://ejemplo.com')
    expect(html).toContain('<a href="https://ejemplo.com">texto</a>')
  })

  it('renderiza enlaces automáticos', () => {
    expect(renderMarkdown('<https://ejemplo.com>')).toContain('<a href="https://ejemplo.com">')
  })
})

describe('código en línea', () => {
  it('renderiza código inline', () => {
    expect(renderMarkdown('`código`')).toContain('<code>código</code>')
  })
})

describe('imágenes', () => {
  it('renderiza imagen inline con alt', () => {
    expect(renderMarkdown('![alt](/ruta/img.jpg)')).toContain('<img src="/ruta/img.jpg" alt="alt">')
  })

  it('soporta título en la imagen', () => {
    expect(renderMarkdown('![alt](/img.jpg "título")')).toContain('title="título"')
  })

  it('renderiza imagen por referencia', () => {
    const html = renderMarkdown('![alt][img]\n\n[img]: /ruta/img.jpg')
    expect(html).toContain('<img src="/ruta/img.jpg" alt="alt">')
  })
})

describe('links automáticos (linkify)', () => {
  it('convierte URLs desnudas en enlaces', () => {
    expect(renderMarkdown('https://ejemplo.com')).toContain('<a href="https://ejemplo.com">')
  })

  it('convierte emails desnudos en enlaces', () => {
    expect(renderMarkdown('correo@ejemplo.com')).toContain('<a href="mailto:')
  })
})

describe('escape de caracteres', () => {
  it('renderiza asterisco escapado literalmente', () => {
    const html = renderMarkdown('\\*no cursiva\\*')
    expect(html).not.toContain('<em>')
    expect(html).toContain('*no cursiva*')
  })

  it('renderiza almohadilla escapada literalmente', () => {
    const html = renderMarkdown('\\# no encabezado')
    expect(html).not.toContain('<h1>')
    expect(html).toContain('# no encabezado')
  })
})

describe('tablas GFM', () => {
  it('renderiza tabla básica', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('aplica alineación de columnas', () => {
    const html = renderMarkdown('| A | B |\n| :--- | ---: |\n| 1 | 2 |')
    expect(html).toContain('text-align:left')
    expect(html).toContain('text-align:right')
  })
})

describe('casillas de verificación', () => {
  it('renderiza tareas sin marcar', () => {
    const html = renderMarkdown('- [ ] pendiente')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('pendiente')
  })

  it('renderiza tareas marcadas', () => {
    const html = renderMarkdown('- [x] hecho')
    expect(html).toContain('checked')
  })
})

describe('seguridad', () => {
  it('escapa HTML crudo (no lo renderiza)', () => {
    const html = renderMarkdown('<script>alert("x")</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
