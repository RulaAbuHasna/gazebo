import { render } from '@testing-library/react'

import RadioInput from './RadioInput'

describe('Radio', () => {
  let wrapper

  describe('renders default radio input', () => {
    it('renders default with label', async () => {
      wrapper = render(<RadioInput label={'This is the label'} />)
      const label = await wrapper.findByText('This is the label')
      expect(label).toBeInTheDocument()
    })
  })
})
