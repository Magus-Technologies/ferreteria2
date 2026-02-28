declare module 'qz-tray' {
  const qz: {
    websocket: {
      connect(): Promise<void>
      disconnect(): Promise<void>
      isActive(): boolean
    }
    printers: {
      find(): Promise<string[]>
      find(query: string): Promise<string>
    }
    configs: {
      create(
        printer: string,
        options?: {
          scaleContent?: boolean
          rasterize?: boolean
          margins?: { top: number; right: number; bottom: number; left: number }
          size?: { width: number; height: number }
          units?: string
          colorType?: string
          copies?: number
        }
      ): object
    }
    print(
      config: object,
      data: Array<{
        type: string
        format: string
        flavor?: string
        data: string
      }>
    ): Promise<void>
  }
  export default qz
}
