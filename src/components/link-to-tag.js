import React from 'react'
import { Link } from 'gatsby'
import tagToPath from '../utils/tag-to-path.js'

export default function LinkToTag ({ tag, ...props }) {
  return (<Link to={tagToPath(tag)} {...props} />)
}
