/**
 * Kamisato Ayaka ice-bloom theme + desktop pet.
 *
 * Registers an `ayaka-light` and `ayaka-dark` theme through the DSH
 * ThemeRuntime, and spawns:
 *   - A semi-transparent Ayaka portrait on the right edge
 *   - A clickable Ayaka chibi head pet resting on the chat input edge
 *   - Falling sakura petals + snowflakes (mixed sizes: tiny + large)
 *
 * Voice + text are synced: each click plays one audio file and shows
 * the matching text bubble for the duration of the audio. Audio and
 * text ONLY play on click — no auto-play, no random intervals.
 * Hover triggers a happy bounce animation.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Required services (cordis fiber inject — the loader passes all module
 * exports as an object plugin). `theme` is the ThemeRuntime service owned by
 * ui-theme; without declaring it here, `ctx.theme` is unreachable and the
 * loader throws `cannot get property "theme" without inject`.
 */
export declare const inject: string[];
/**
 * Client plugin body: register Ayaka themes and spawn the pet + petals.
 * @param ctx - client cordis context with ctx.theme injected by ui-theme.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map