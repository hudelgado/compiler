import {
  BINDING_ATTRIBUTES_KEY,
  BINDING_BINDINGS_KEY,
  BINDING_COMPONENTS_KEY,
  BINDING_HTML_KEY,
  BINDING_ID_KEY,
  BINDING_SLOTS_KEY,
  BINDING_TYPES,
  BINDING_TYPE_KEY,
  COMPONENTS_REGISTRY,
  SLOT_ATTRIBUTE,
  TAG_BINDING_TYPE
} from '../constants'
import {
  cleanAttributes,
  createSelectorProperties,
  getChildrenNodes,
  getNodeAttributes
} from '../utils'
import attributeExpression from '../expressions/attribute'
import build from '../builder'
import {builders} from '../../../utils/build-types'
import {simplePropertyNode} from '../../../utils/custom-ast-nodes'

/**
 * Find the slots in the current component and group them under the same id
 * @param   {RiotParser.Node.Tag} sourceNode - the custom tag
 * @returns {Object} object containing all the slots grouped by name
 */
function groupSlots(sourceNode) {
  return sourceNode.nodes.reduce((acc, node) => {
    const slotAttribute = findSlotAttribute(node)

    if (slotAttribute) {
      acc[slotAttribute.value] = node
    } else {
      acc.default = {
        nodes: [...getChildrenNodes(acc.default), node]
      }
    }

    return acc
  }, {
    default: null
  })
}

/**
 * Create the slot entity to pass to the riot-dom bindings
 * @param   {string} id - slot id
 * @param   {RiotParser.Node.Tag} sourceNode - slot root node
 * @param   {stiring} sourceFile - source file path
 * @param   {string} sourceCode - original source
 * @returns {AST.Node} ast node containing the slot object properties
 */
function buildSlot(id, sourceNode, sourceFile, sourceCode) {
  const cloneNode = {
    ...sourceNode,
    // avoid to render the slot attribute
    attributes: getNodeAttributes(sourceNode).filter(attribute => attribute.name !== SLOT_ATTRIBUTE)
  }
  const [html, bindings] = build(cloneNode, sourceFile, sourceCode)

  return builders.objectExpression([
    simplePropertyNode(BINDING_ID_KEY, builders.literal(id)),
    simplePropertyNode(BINDING_HTML_KEY, builders.literal(html)),
    simplePropertyNode(BINDING_BINDINGS_KEY, builders.arrayExpression(bindings))
  ])
}

/**
 * Find the slot attribute if it exists
 * @param   {RiotParser.Node.Tag} sourceNode - the custom tag
 * @returns {RiotParser.Node.Attr|undefined} the slot attribute found
 */
function findSlotAttribute(sourceNode) {
  return getNodeAttributes(sourceNode).find(attribute => attribute.name === SLOT_ATTRIBUTE)
}

/**
 * Transform a RiotParser.Node.Tag into a tag binding
 * @param   { RiotParser.Node.Tag } sourceNode - the custom tag
 * @param   { string } selectorAttribute - attribute needed to select the target node
 * @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @returns { AST.Node } an each binding node
 */
export default function createTagBinding(sourceNode, selectorAttribute, sourceFile, sourceCode) {
  return builders.objectExpression([
    simplePropertyNode(BINDING_TYPE_KEY,
      builders.memberExpression(
        builders.identifier(BINDING_TYPES),
        builders.identifier(TAG_BINDING_TYPE),
        false
      ),
    ),
    simplePropertyNode(BINDING_COMPONENTS_KEY, builders.memberExpression(
      builders.identifier(COMPONENTS_REGISTRY),
      builders.literal(sourceNode.name),
      true
    )),
    simplePropertyNode(BINDING_SLOTS_KEY, builders.arrayExpression([
      ...Object.entries(groupSlots(sourceNode)).map(([key, value]) => buildSlot(key, value, sourceFile, sourceCode))
    ])),
    simplePropertyNode(BINDING_ATTRIBUTES_KEY, builders.arrayExpression([
      ...cleanAttributes(sourceNode)
        .filter(attribute => attribute.name !== selectorAttribute)
        .map(attribute => attributeExpression(attribute, sourceFile, sourceCode))
    ])),
    ...createSelectorProperties(selectorAttribute)
  ])
}