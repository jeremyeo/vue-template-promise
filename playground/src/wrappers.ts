import { createTemplateWrapper } from '../../src'

export type DialogResult = 'ok' | 'cancel'

export const TemplateWrapper = createTemplateWrapper<DialogResult, [string]>()
