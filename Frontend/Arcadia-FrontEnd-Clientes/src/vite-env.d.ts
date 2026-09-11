/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL?: string
  readonly VITE_LOGIN_URL?: string
  readonly VITE_ADMIN_URL?: string
  readonly [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}

declare module 'react' {
  const React: any
  export default React
  export function useState<T = any>(initialState?: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void
  export function useReducer<R extends (state: any, action: any) => any>(
    reducer: R,
    initialState: any
  ): [any, (action: any) => void]
  export function createContext<T = any>(defaultValue: T): any
  export function useContext<T = any>(context: any): T
  export type ReactNode = any
  export type FC<T = any> = any
}

declare module 'react-dom' {
  const ReactDOM: any
  export default ReactDOM
}

declare module 'react-router-dom' {
  export const Link: any
  export const useNavigate: any
  export const Routes: any
  export const Route: any
  export const useSearchParams: any
  export const useParams: any
}

declare module 'lucide-react' {
  export const ShoppingCart: any
  export const Search: any
  export const User: any
  export const Star: any
  export const Grid: any
  export const List: any
  export const Plus: any
  export const Minus: any
  export const Trash2: any
  export const ArrowLeft: any
  export const CheckCircle: any
}


