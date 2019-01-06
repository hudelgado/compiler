import {compile, registerPreprocessor} from '../src'
import {evaluateScript, getFixture, scssPreprocessor} from './helpers'
import {expect} from 'chai'
import pug from 'pug'
import {unregister} from '../src/preprocessors'

describe('Core specs', () => {
  describe('Simple tags', () => {
    it('The compiler generates a sourcemap and an output', async function() {
      const result = await compile(getFixture('my-component.riot'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default).to.have.all.keys('tag', 'css', 'template')
    })

    it('Tags without css and javascript can be properly compiled', async function() {
      const result = await compile(getFixture('only-html.riot'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default.css).to.be.not.ok
      expect(output.default.tag).to.be.not.ok
      expect(output.default.template).to.be.ok
    })

    it('Tags without html and javascript can be properly compiled', async function() {
      const result = await compile(getFixture('only-css.riot'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default.css).to.be.ok
      expect(output.default.tag).to.be.not.ok
      expect(output.default.template).to.be.not.ok
    })

    it('Tags without html and css can be properly compiled', async function() {
      const result = await compile(getFixture('only-javascript.riot'))
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default.css).to.be.not.ok
      expect(output.default.tag).to.be.ok
      expect(output.default.template).to.be.not.ok
    })
  })

  describe('Preprocessed tags', () => {
    before(() => {
      registerPreprocessor('css', 'scss', scssPreprocessor)
      registerPreprocessor('template', 'pug', (code, {file}) => {
        return {
          code: pug.render(code, {
            filename: file
          }),
          map: {}
        }
      })
    })

    after(() => {
      unregister('css', 'scss')
      unregister('template', 'pug')
    })

    it('The Pug and scss preprocessors work as expected', async function() {
      const result = await compile(getFixture('pug-component.pug'), {
        template: 'pug',
        file: 'pug-component.pug'
      })
      const output = evaluateScript(result.code)

      expect(result.code).to.be.a('string')
      expect(result.map).to.be.not.an('undefined')
      expect(output.default).to.have.all.keys('tag', 'css', 'template')
      expect(output.default.tag.foo).to.be.ok
    })
  })
})