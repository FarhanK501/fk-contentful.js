function isResourceLink (field) {
  return field && field.sys && field.sys.type === 'ResourceLink'
}

function getResourceLinkFields (data) {
  const items = [].concat(...(data.items || []), ...Object.values(data.includes || {}).flat())
  const fields = items.flatMap(({ fields }) => Object.values(fields).flat())
  return fields.filter(isResourceLink)
}

function parseResourceLink (resourceLink) {
  const urn = resourceLink.sys.urn
  // For now just assume every resourceLink has type Contentful:Entry
  const [, spaceId, , entryId] = urn.split('/')
  return { spaceId, entryId, urn }
}

function groupBy (key, objArray) {
  return objArray.reduce((acc, obj) => {
    const objKey = obj[key]
    acc[objKey] = (acc[objKey] || []).concat(obj)
    return acc
  }, {})
}

function getEntitiesFromSpaceFn (extraApis = {}) {
  return async (spaceId, entryIds) => {
    if (!entryIds.length) {
      return []
    }
    const apiInstance = extraApis[spaceId]
    if (!apiInstance) {
      return []
    }
    const uniqueEntryIds = [...new Set(entryIds)]
    const response = await apiInstance.getEntries({ 'sys.id': uniqueEntryIds }).catch(() => ({}))
    return response.items || []
  }
}

export async function addResourceLinksToIncludes (data, extraApis = {}) {
  const getEntitiesFromSpace = getEntitiesFromSpaceFn(extraApis)

  const resourceLinkFields = getResourceLinkFields(data)
  const entitiesBySpace = groupBy('spaceId', resourceLinkFields.map(parseResourceLink))

  const resourceLinkResponses = Object.entries(entitiesBySpace).map(([spaceId, entries]) =>
    getEntitiesFromSpace(spaceId, entries.map(({ entryId }) => entryId))
  )
  const resourceLinkEntries = (await Promise.all(resourceLinkResponses)).flat()

  return {
    ...data,
    includes: {
      ...data.includes,
      Entry: [...((data.includes && data.includes.Entry) || []), ...resourceLinkEntries]
    }
  }
}