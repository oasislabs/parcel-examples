import Parcel from '@oasislabs/parcel';

// Re-export Parcel class from @oasislabs/parcel to the browser.
declare global {
  interface Window {
    Parcel: typeof Parcel;
  }
}
window.Parcel = Parcel;
