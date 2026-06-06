// "Other State Centers" tab — policy comparison matrix + bills watchlist.
// All rendering lives in OtherStateCentersTab and its two child components;
// this shell simply mounts it. Fonts (Fraunces, Inter, JetBrains Mono) are
// loaded globally via src/app/globals.css.

import OtherStateCentersTab from './OtherStateCentersTab'

export default function OtherStateCentersPage() {
  return <OtherStateCentersTab />
}
