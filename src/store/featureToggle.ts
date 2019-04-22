export const featureToggles = {
  showAutoGrab: false,
  showDocList: true,
  devlog: true
};

export const devlog = (str: string, show=true) => {
  if (featureToggles.devlog && show) {
    console.log(str)
  }
}