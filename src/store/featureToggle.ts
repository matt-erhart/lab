export const featureToggles = {
  showAutoGrab: true,
  showDocList: true,
  devlog: true
};

export const devlog = (str: any, show=true) => {
  if (featureToggles.devlog && show) {
    console.log(str)
  }
}