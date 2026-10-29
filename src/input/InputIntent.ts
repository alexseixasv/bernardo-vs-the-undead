export interface InputIntent {
  axisX: number;
  axisY: number;
}

export const IDLE_INTENT: InputIntent = {
  axisX: 0,
  axisY: 0,
};

export function createInputIntent(axisX: number, axisY: number): InputIntent {
  const length = Math.hypot(axisX, axisY);
  if (length <= 1) {
    return { axisX, axisY };
  }

  return {
    axisX: axisX / length,
    axisY: axisY / length,
  };
}

export function intentLength(intent: InputIntent): number {
  return Math.hypot(intent.axisX, intent.axisY);
}
