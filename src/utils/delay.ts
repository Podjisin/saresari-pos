export interface delayProps {
  ms: number;
}

export const delay = ({ ms }: delayProps): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
