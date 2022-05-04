import { useQuery } from 'react-query'

import Api from 'shared/api'

export function usePull({ provider, owner, repo, pullId }) {
  const query = `
    query Pull($owner: String!, $repo: String!, $pullId: Int!) {
        owner(username: $owner) {
          repository(name: $repo) {
            pull(id: $pullId) {
              pullId
              title
              state
              author {
                username
              }
              updatestamp
              head {
                commitid
                totals {
                  coverage
                }
              }
              comparedTo {
                commitid
              }
              compareWithBase {
                patchTotals {
                  coverage
                }
                changeWithParent
              }
              pullComparison {
                baseTotals {
                  coverage
                  fileCount
                  lineCount
                  hitsCount
                  missesCount
                  partialsCount
                }
                headTotals {
                  coverage
                  fileCount
                  lineCount
                  hitsCount
                  missesCount
                  partialsCount
                }
                files {
                  baseName
                  headName
                  isNewFile
                  baseTotals {
                    coverage
                    lineCount
                    hitsCount
                    missesCount
                    partialsCount
                  }
                  headTotals {
                    coverage
                    lineCount
                    hitsCount
                    missesCount
                    partialsCount
                  }
                  segments {
                    header
                    lines {
                      baseNumber
                      headNumber
                      baseCoverage
                      headCoverage
                      content
                    }
                  }
                }
              }
              commits {
                totalCount
                pageInfo {
                  hasNextPage
                  startCursor
                  hasPreviousPage
                }
                edges {
                  node {
                    commitid
                    message
                    createdAt
                    author {
                      username
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

  return useQuery(['pull', provider, owner, repo, pullId], () => {
    return Api.graphql({
      provider,
      query,
      variables: {
        provider,
        owner,
        repo,
        pullId: parseInt(pullId, 10),
      },
    }).then((res) => res?.data?.owner?.repository?.pull)
  })
}
