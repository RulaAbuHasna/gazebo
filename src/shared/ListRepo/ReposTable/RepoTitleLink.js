import PropTypes from 'prop-types'

import AppLink from 'shared/AppLink'
import Icon from 'ui/Icon'

function RepoTitleLink({ repo, showRepoOwner, pageName }) {
  const options = {
    owner: repo.author.username,
    repo: repo.name,
  }

  return (
    <div className="flex items-center">
      <AppLink
        pageName={pageName}
        options={options}
        className="flex text-ds-gray-quinary items-center hover:underline"
      >
        {repo.private ? (
          <Icon size="sm" variant="solid" name="lock-closed" />
        ) : (
          <Icon size="sm" variant="solid" name="globe-alt" />
        )}
        <span className="ml-2.5 text-sm text-black">
          {showRepoOwner && `${repo?.author?.username} / `}
          <span className="font-semibold">{repo.name}</span>
        </span>
      </AppLink>
      {repo.private && (
        <span className="ml-2 px-1 py-0.5 border border-ds-gray-tertiary rounded text-xs text-ds-gray-senary">
          Private
        </span>
      )}
    </div>
  )
}

RepoTitleLink.propTypes = {
  repo: PropTypes.shape({
    private: PropTypes.bool.isRequired,
    author: PropTypes.shape({
      username: PropTypes.string,
    }),
    name: PropTypes.string,
  }),
  showRepoOwner: PropTypes.bool.isRequired,
  pageName: PropTypes.string.isRequired,
}

export default RepoTitleLink
