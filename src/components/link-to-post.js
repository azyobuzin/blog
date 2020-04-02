import React from 'react'
import { Link } from 'gatsby'
import slugToPath from '../utils/slug-to-path.js'

export default function LinkToPost ({ slug, ...props }) {
  return (<Link to={slugToPath(slug)} {...props} />)
}
