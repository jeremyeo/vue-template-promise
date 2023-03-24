import type { Component, ComponentPublicInstance, DefineComponent, TransitionGroupProps } from 'vue'
import { Fragment, TransitionGroup, defineComponent, getCurrentInstance, h, onMounted, onUnmounted, ref, render, shallowReactive } from 'vue'

export interface TemplatePromiseProps<Return = any, Args extends any[] = []> {
  /**
   * The promise instance.
   */
  promise: Promise<Return> | undefined
  /**
   * Resolve the promise.
   */
  resolve: (v: Return | Promise<Return>) => void
  /**
   * Reject the promise.
   */
  reject: (v: any) => void
  /**
   * Arguments passed to TemplatePromise.start()
   */
  args: Args
  /**
   * Indicates if the promise is resolving.
   * When passing another promise to `resolve`, this will be set to `true` until the promise is resolved.
   */
  isResolving: boolean
  /**
   * Options passed to createTemplatePromise()
   */
  options: TemplatePromiseOptions
  /**
   * Unique key for list rendering.
   */
  key: number
}

export interface TemplatePromiseOptions {
  /**
   * Determines if the promise can be called only once at a time.
   *
   * @default false
   */
  singltone?: boolean

  /**
   * Transition props for the promise.
   */
  transition?: TransitionGroupProps
}

export interface TemplatePromiseStart<Return, Args extends any[] = []> {
  start: (...args: Args) => Promise<Return>
}

export type TemplatePromise<Return = any, Args extends any[] = []> = DefineComponent<{}> & {
  new(): {
    $slots: {
      default(_: TemplatePromiseProps<Return, Args>): any
    }
  }
}

type Wrapper<T> = T[Exclude<{
  [K in keyof T]: T[K] extends TemplatePromise<any, any> ? K : never;
}[keyof T], '$el'>]

export function useTemplatePromise<T extends ComponentPublicInstance>(
  compoent: Component,
  options: TemplatePromiseOptions,
): TemplatePromiseStart<
  Wrapper<T> extends TemplatePromise<infer Return, any> ? Return : any,
  Wrapper<T> extends TemplatePromise<any, infer Arg> ? Arg : any
>

export function useTemplatePromise<Return, Args extends any[] = []>(
  options: TemplatePromiseOptions,
): TemplatePromise<Return, Args> & TemplatePromiseStart<Return, Args>

export function useTemplatePromise<Return, Args extends any[] = []>(
  compOrOpts: Component | TemplatePromiseOptions,
  opts?: TemplatePromiseOptions,
) {
  const component = opts ? compOrOpts as Component : null
  const options = opts ?? compOrOpts as TemplatePromiseOptions

  let index = 0
  let unmount: () => void
  const components = shallowReactive<{ component: Component; props: TemplatePromiseProps<any, any> }[]>([])
  const instances = ref<TemplatePromiseProps<any, any>[]>([])
  const currentInstance = getCurrentInstance()
  if (!currentInstance)
    return

  function create(...args: Args) {
    const props = shallowReactive<TemplatePromiseProps<Return, Args>>({
      key: index++,
      args,
      promise: undefined,
      resolve: () => {},
      reject: () => {},
      isResolving: false,
      options,
    })

    instances.value.push(props)
    if (component)
      components.push({ component, props })

    props.promise = new Promise<Return>((_resolve, _reject) => {
      props.resolve = (v) => {
        props.isResolving = true
        return _resolve(v)
      }
      props.reject = _reject
    })

    props.promise.finally(() => {
      props.promise = undefined
      const index = instances.value.indexOf(props)
      if (index !== -1) {
        instances.value.splice(index, 1)
        components.splice(index, 1)
      }
    })
    return props.promise
  }

  function start(...args: Args) {
    if (options.singltone && instances.value.length > 0)
      return instances.value[0].promise
    return create(...args)
  }

  if (component) {
    const PromiseComponent = defineComponent(() => {
      const renderList = () => {
        const list = components.map(({ props, component }) => h(component, { key: props.key, slotProp: props }))
        return list
      }

      if (options.transition) {
        return () => {
          const vnode = h(TransitionGroup, options.transition, renderList)
          vnode.appContext = currentInstance.appContext
          return vnode
        }
      }
      return renderList
    })

    onMounted(() => {
      const container = document.createElement('div')
      const vnode = h(PromiseComponent)
      vnode.appContext = currentInstance.appContext
      render(vnode, container)
      document.body.appendChild(container)
      unmount = () => {
        render(null, container)
        container.remove()
      }
    })
    onUnmounted(() => unmount && unmount())

    return { start } as any
  }
  else {
    const PromiseComponent = defineComponent((_, { slots }) => {
      const renderList = () => instances.value.map(props => h(Fragment, { key: props.key }, slots.default?.(props)))
      if (options.transition)
        return () => h(TransitionGroup, options.transition, renderList)
      return renderList
    })

    PromiseComponent.start = start

    return PromiseComponent as any
  }
}

export function createTemplateWrapper<Return, Args extends any[] = []>() {
  return defineComponent({
    name: 'TemplateWrapper',
    props: { slotProp: Object },
    setup: (props, { slots }) => {
      return () => h('div', slots.default?.(props.slotProp))
    },
  }) as TemplatePromise<Return, Args>
}
