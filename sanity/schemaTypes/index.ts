import { type SchemaTypeDefinition } from 'sanity'

import home from './home'
import about from './about'
import post from './post'
import lab from './lab'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [home, about, post, lab],
}
