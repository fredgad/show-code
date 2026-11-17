export type RecorderDemoScene = 'emergency' | 'verifiable-home' | 'verifiable-loading' | 'verifiable-recording';

const emergencyDuration = 7_300;
const verifiedTimeline = {
  collapse: [1_450, 2_280],
  scroll: [2_480, 4_400],
  select: [4_720, 5_250],
  openRecorder: [6_200, 6_850],
  loadingDuration: 1_000,
  recordingDuration: 5_950
} as const;

function progressAt(time: number, [start, end]: readonly [number, number]): number {
  const progress = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

export function bindRecorderDemo(
  film: HTMLVideoElement,
  showcase: HTMLElement,
  onSceneChange: (scene: RecorderDemoScene) => void
): () => void {
  let scene: RecorderDemoScene = 'emergency';
  let frame: number | undefined;
  let previousFrame: number | undefined;
  let elapsed = 0;
  const recordingStart = verifiedTimeline.openRecorder[1] + verifiedTimeline.loadingDuration;
  const duration = emergencyDuration + recordingStart + verifiedTimeline.recordingDuration;

  const draw = (timestamp: number) => {
    if (previousFrame !== undefined) {
      elapsed = (elapsed + timestamp - previousFrame) % duration;
    }
    previousFrame = timestamp;

    const verifiedTime = elapsed - emergencyDuration;
    let nextScene: RecorderDemoScene = 'emergency';
    if (verifiedTime >= 0) {
      if (verifiedTime < verifiedTimeline.openRecorder[1]) {
        nextScene = 'verifiable-home';
        showcase.style.setProperty('--demo-collapse', String(progressAt(verifiedTime, verifiedTimeline.collapse)));
        showcase.style.setProperty('--demo-scroll', String(progressAt(verifiedTime, verifiedTimeline.scroll)));
        showcase.style.setProperty('--demo-select', String(progressAt(verifiedTime, verifiedTimeline.select)));
        showcase.style.setProperty('--demo-record', String(progressAt(verifiedTime, verifiedTimeline.openRecorder)));
      } else {
        nextScene = verifiedTime < recordingStart ? 'verifiable-loading' : 'verifiable-recording';
      }
    }
    if (nextScene !== scene) {
      scene = nextScene;
      onSceneChange(scene);
    }
    frame = window.requestAnimationFrame(draw);
  };

  const start = () => {
    if (frame === undefined) {
      frame = window.requestAnimationFrame(draw);
    }
  };
  const stop = () => {
    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
      frame = undefined;
    }
    previousFrame = undefined;
  };

  const stopEvents = ['pause', 'waiting', 'error'] as const;
  film.addEventListener('playing', start);
  stopEvents.forEach(event => film.addEventListener(event, stop));

  return () => {
    stop();
    film.removeEventListener('playing', start);
    stopEvents.forEach(event => film.removeEventListener(event, stop));
  };
}
