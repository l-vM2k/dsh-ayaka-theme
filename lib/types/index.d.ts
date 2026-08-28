/** Required services: the webServer to register the asset route. */
export declare const inject: string[];
/**
 * Register the `/ayaka-assets` prefix route serving static files from the
 * package's `assets/` directory.
 * @param ctx - cordis context with ctx.webServer injected.
 */
export declare function apply(ctx: {
    webServer: {
        register: (route: {
            kind: 'prefix';
            path: string;
            handler: (req: {
                method?: string;
                url?: string;
            }, res: {
                writeHead: (status: number, headers?: Record<string, string>) => void;
                end: (data?: Buffer | string) => void;
            }) => void | Promise<void>;
        }) => () => void;
    };
}): void;
//# sourceMappingURL=index.d.ts.map