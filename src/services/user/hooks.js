import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import usePrevious from 'react-use/lib/usePrevious'

import { mapEdges } from 'shared/utils/graphql'
import Api from 'shared/api'

const currentUserFragment = `
fragment CurrentUserFragment on Me {
  email
  privateAccess
  user {
    name
    username
    avatarUrl
    student
    studentCreatedAt
    studentUpdatedAt
  }
  trackingMetadata {
    ownerid
    serviceId
    plan
    staff
    hasYaml
    service
    bot
    delinquent
    didTrial
    planProvider
    planUserCount
    createstamp
    updatestamp
  }
}
`

export function useUser(options = {}) {
  const { provider } = useParams()

  const query = `
    query CurrentUser {
      me {
        ...CurrentUserFragment
      }
    }
    ${currentUserFragment}
  `

  return useQuery(
    ['currentUser', provider],
    () =>
      Api.graphql({ provider, query }).then((res) => {
        const currentUser = res?.data?.me

        if (currentUser) return currentUser

        // imitate REST behavior until we implement getting the current user
        // with a better approach
        return Promise.reject({
          status: 401,
          data: {
            message: 'Unauthenticated',
          },
        })
      }),
    options
  )
}

export function useOwner({ username }) {
  const { provider } = useParams()
  const query = `
    query DetailOwner($username: String!) {
      owner(username: $username) {
        username
        avatarUrl
        isCurrentUserPartOfOrg
      }
    }
  `

  const variables = {
    username,
  }

  return useQuery(['owner', variables, provider], () => {
    return Api.graphql({ provider, query, variables }).then((res) => {
      return res?.data?.owner
    })
  })
}

export function useMyContexts() {
  const { provider } = useParams()
  const query = `
    query MyContext {
      me {
        owner {
          username
          avatarUrl
        }
        myOrganizations {
          edges {
            node {
              username
              avatarUrl
            }
          }
        }
      }
    }
  `

  return useQuery(['myContexts', provider], () =>
    Api.graphql({ provider, query }).then((res) => {
      const me = res?.data?.me
      return me
        ? {
            currentUser: me.owner,
            myOrganizations: mapEdges(me.myOrganizations),
          }
        : null
    })
  )
}

export function useUpdateProfile({ provider }) {
  const queryClient = useQueryClient()
  const mutation = `
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        me {
          ...CurrentUserFragment
        }
        error {
          __typename
        }
      }
    }
    ${currentUserFragment}
  `

  return useMutation(
    ({ name, email }) => {
      return Api.graphqlMutation({
        provider,
        query: mutation,
        mutationPath: 'updateProfile',
        variables: {
          input: {
            name,
            email,
          },
        },
      }).then((res) => res?.data?.updateProfile?.me)
    },
    {
      onSuccess: (user) => {
        queryClient.setQueryData(['currentUser', provider], () => user)
      },
    }
  )
}

function fetchIsSyncing(provider) {
  const query = `
    query IsSyncing {
      me {
        isSyncing: isSyncingWithGitProvider
      }
    }
  `
  return Api.graphql({ provider, query }).then((res) => {
    return Boolean(res?.data?.me?.isSyncing)
  })
}

function triggerSync(provider) {
  const mutation = `
    mutation SyncData {
      syncWithGitProvider {
        me {
          isSyncing: isSyncingWithGitProvider
        }
        error {
          __typename
        }
      }
    }
  `
  return Api.graphqlMutation({
    provider,
    query: mutation,
    mutationPath: 'syncWithGitProvider',
  }).then((res) => {
    return Boolean(res?.data?.syncWithGitProvider?.me?.isSyncing)
  })
}

// takes a callback for when the sync is finished
// return if there is a sync in progress, and a function to trigger a sync
export function useResyncUser() {
  const { provider } = useParams()
  const queryClient = useQueryClient()

  // where we store the data query
  const keyCache = ['isSyncing', provider]

  // we get the value we have from the cache as we need to for the interval refetch
  const isSyncingInCache = Boolean(queryClient.getQueryData(keyCache))

  // when mutation, we set the isSyncing of the cache the return of the
  const mutationData = useMutation(() => triggerSync(provider), {
    useErrorBoundary: false,
    onSuccess: (data) => queryClient.setQueryData(keyCache, data),
  })

  // we consider that data is syncing when the user triggered the mutation
  // or if GraphQL returned true for me.isSyncingWithGitProvider
  const isSyncing = mutationData.isLoading || isSyncingInCache

  // useQuery will automatically feed the so we don't need to care about return
  useQuery(keyCache, () => fetchIsSyncing(provider), {
    suspense: false,
    useErrorBoundary: false,
    // refetch every 2 seconds if we are syncing
    refetchInterval: isSyncing ? 2000 : null,
  })

  // when isSyncing goes from true to false, we call onSyncFinish
  const prevIsSyncing = usePrevious(isSyncing)
  useEffect(() => {
    if (prevIsSyncing && !isSyncing) {
      queryClient.refetchQueries(['repos'])
    }
  }, [prevIsSyncing, isSyncing, queryClient])

  return {
    isSyncing,
    triggerResync: mutationData.mutateAsync,
  }
}
