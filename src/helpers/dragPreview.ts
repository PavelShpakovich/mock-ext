import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';

type NativeSetDragImage = Parameters<typeof setCustomNativeDragPreview>[0]['nativeSetDragImage'];
type DragInput = Parameters<typeof preserveOffsetOnSource>[0]['input'];

const PREVIEW_RADIUS = '0.75rem';
const PREVIEW_BACKGROUND = 'var(--color-white, #ffffff)';

interface RoundedCardPreviewOptions {
  element: HTMLElement;
  nativeSetDragImage: NativeSetDragImage | null;
  input: DragInput;
}

export function setRoundedCardDragPreview({ element, nativeSetDragImage, input }: RoundedCardPreviewOptions): void {
  if (!nativeSetDragImage) return;

  setCustomNativeDragPreview({
    nativeSetDragImage,
    getOffset: preserveOffsetOnSource({
      element,
      input,
    }),
    render: ({ container }) => {
      const preview = element.cloneNode(true) as HTMLElement;
      preview.style.margin = '0';
      preview.style.boxSizing = 'border-box';
      preview.style.width = `${element.clientWidth}px`;
      preview.style.borderRadius = PREVIEW_RADIUS;
      preview.style.overflow = 'hidden';
      preview.style.background = PREVIEW_BACKGROUND;
      container.appendChild(preview);

      return () => {
        container.innerHTML = '';
      };
    },
  });
}
