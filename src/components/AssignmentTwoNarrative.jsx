import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import tippy, { followCursor } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { assignment2Data } from '../data/assignment2Data'
import { photoMaskData } from '../data/photoMaskData'
import PeoplePanel from './PeoplePanel'
import PlaceSubjectAtlas from './PlaceSubjectAtlas'
import TemporalRibbon from './TemporalRibbon'
import StagedVisual from './StagedVisual'
import JsonScrollExplainer from './JsonScrollExplainer'
import { PresenceLineChart, PeopleCountLineChart } from './AnnotationTimeline'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import { photographUrl, photographMiddleSizedUrl } from '../lib/photographs'
import MagneticLink from './MagneticLink'

const Network = lazy(() => import('./Network'))
// const ChromaticSwarm     = lazy(() => import('./ChromaticSwarm'))
const GemmaSearch        = lazy(() => import('./GemmaSearch'))
const PhotoMap           = lazy(() => import('./PhotoMap'))
const SemanticTimeline   = lazy(() => import('./SemanticTimeline'))
const SubjectTimeline    = lazy(() => import('./SubjectTimeline'))

const SWARM_STEPS = [
  {
    key: 'scatter',
    title: 'The full corpus, set free',
    desc: 'Each circle is one photograph. Radius encodes style energy; colour is the dominant hue. Circles drift loosely near their visual cluster.',
  },
  {
    key: 'timeline',
    title: 'Arranged along time',
    desc: 'Circles slide into chronological order. The beeswarm spread on the vertical axis prevents overlap while preserving temporal position on the x-axis.',
  },
  {
    key: 'families',
    title: 'Gathered by visual family',
    desc: 'Eight CLIP clusters pull their members into distinct vertical columns — each band is a recurring visual theme in the archive.',
  },
  {
    key: 'energy',
    title: 'Sorted by style energy',
    desc: 'Low-contrast, quiet photographs settle to the left; high-energy images rise to the right. The most intense nodes emit a coloured glow.',
  },
]

gsap.registerPlugin(useGSAP)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CLUSTER_COLOURS = [
  '#274c77', '#6096ba', '#e09f3e', '#9c6644',
  '#4d6a6d', '#7f5539', '#7b8c56', '#8b6f9c',
]

const imageUrl = photographUrl

const HERO_PREVIEW_IMAGES = [
  '2019-01-08_Hanoi_00006.JPG',
  '2013-08-09_Lausanne_035.JPG',
  '2021-03-27_Linxia_001.jpg',
  '2010-06-25_Shanghai_021.JPG',
  '2024-02-14_Qinan_002.JPG',
  '2019-12-22_Hongkong_029.jpg',
  '2004-08-19_Suzhou_008.JPG',
  '2013-08-05_Italy_250.jpg',
  '2004-08-18_Suzhou_015.JPG',
  '2004-08-21_Shanghai_012.JPG',
  '2007-07-18_Tibet_093.JPG',
  '2024-01-23_Hangzhou_006.JPG',
  '2006-04-16_Lanzhou_009.JPG',
  '2013-08-06_Venice_070.JPG',
  '2006-07-10_Guizhou_034.JPG',
  '2013-07-03_Xinjiang_040.JPG',
  '2007-07-18_Tibet_081.JPG',
  '2007-07-20_Tibet_049.JPG',
  '2006-07-10_Guizhou_028.JPG',
  '2013-08-05_Italy_052.JPG',
  '2004-08-18_Suzhou_003.JPG',
  '2006-07-10_Guizhou_016.JPG',
  '2012-08-20_Xian_019.JPG',
  '2010-06-30_Kaifeng_007.JPG',
  '2006-04-16_Lanzhou_035.JPG',
  '2013-08-05_Italy_222.jpg',
  '2004-08-18_Suzhou_014.JPG',
  '2004-08-18_Suzhou_005.JPG',
  '2013-08-06_Venice_170.JPG',
  '2013-08-08_Lausanne_195.jpg',
  '2016-11-11_Shenzhen_001.jpg',
  '2013-08-06_Venice_189.JPG',
  '2013-08-08_Lausanne_046.JPG',
  '2013-08-04_Italy_019.JPG',
  '2007-07-23_Tibet_003.JPG',
  '2021-03-27_Linxia_005.jpg',
]

// Extra images not initially displayed — drawn from as flip candidates
const HERO_CANDIDATE_IMAGES = [
  '2010-06-15_Baiyin_004.JPG',
  '2010-06-23_Shanghai_001.JPG',
  '2025-11-04_Vienna_002.jpg',
  '2024-01-07_Macau_004.JPG',
  '2023-04-30_Zhuhai_009.JPG',
  '2023-05-29_Shenzhen_006.JPG',
  '2007-07-16_Tibet_002.JPG',
  '2013-08-07_Lausanne_119.JPG',
  '2013-08-07_Lausanne_121.JPG',
  '2017-08-01_Oxford_001.JPG',
  '2024-01-23_Hangzhou_005.JPG',
  '2023-04-22_Guangzhou_001.JPG',
  '2023-04-22_Guangzhou_002.JPG',
  '2023-07-22_Beijing_001.JPG',
  '2023-07-22_Beijing_002.JPG',
  '2024-03-02_Hongkong_003.JPG',
  '2024-03-28_Hongkong_001.JPG',
  '2023-01-25_Tianshui_012.jpg',
  '2024-05-25_Hongkong_002.JPG',
  '2016-08-19_Hongkong_014.jpg',
  '2025-08-24_Ulaanbaatar_003.jpg',
  '2016-08-19_Hongkong_065.jpg',
  '2025-11-16_Nuremberg_006.jpg',
  '2025-11-04_Vienna_003.jpg',
  '2025-11-04_Vienna_028.jpg',
  '2024-01-22_Hangzhou_008.JPG',
  '2024-02-09_Chengdu_040.JPG',
  '2024-02-14_Qinan_001.JPG',
  '2025-09-21_Cork_002.jpg',
  '2025-11-06_Odense_001.jpg',
]

const ALL_HERO_IMAGES = [...HERO_PREVIEW_IMAGES, ...HERO_CANDIDATE_IMAGES]

const HERO_RAIL_COUNT = 6
const HERO_RAILS = Array.from({ length: HERO_RAIL_COUNT }, (_, railIndex) =>
  HERO_PREVIEW_IMAGES.filter((_, imageIndex) => imageIndex % HERO_RAIL_COUNT === railIndex)
)

const SIMILARITY_PAIR = [
  { filename: '2004-08-19_Suzhou_006.JPG',     date: '19 Aug 2004', place: 'Suzhou'   },
  { filename: '2015-06-16_Dunhuang_00031.jpg', date: '16 Jun 2015', place: 'Dunhuang' },
]

const MASK_DATA_MAP = {
  '2004-08-19_Suzhou_006.JPG':     photoMaskData.suzhou,
  '2015-06-16_Dunhuang_00031.jpg': photoMaskData.dunhuang,
}
const MASK_FILL   = 'rgb(96,150,186)'        // alpha controlled separately via fillOpacity attr
const MASK_STROKE = 'rgba(150,215,255,0.95)'
const MASK_PNG_MAP = {
  '2004-08-19_Suzhou_006.JPG':     '/masks/suzhou_masked.webp',
  '2015-06-16_Dunhuang_00031.jpg': '/masks/dunhuang_masked.webp',
}
const HOVER_FILL   = 'rgb(255,160,50)'    // orange highlight on individual polygon hover
const HOVER_STROKE = 'rgb(255,210,100)'

// ── YOLO annotation view ──────────────────────────────────────────────────────

const YOLO_ANNOTATION_IMAGE = '2019-12-22_Hongkong_022.jpg'

const YOLO_LABEL_RAW = `1 0.1953125 0.6337890625 0.20442708333333334 0.638671875 0.20703125 0.6455078125 0.20703125 0.658203125 0.203125 0.66796875 0.203125 0.67578125 0.1796875 0.734375 0.1796875 0.7451171875 0.19010416666666666 0.779296875 0.19661458333333334 0.7861328125 0.19661458333333334 0.7939453125 0.17578125 0.8583984375 0.16927083333333334 0.88671875 0.171875 0.8994140625 0.15104166666666666 0.9072265625 0.13802083333333334 0.9072265625 0.13541666666666666 0.9052734375 0.14453125 0.8779296875 0.15234375 0.833984375 0.15234375 0.8203125 0.14973958333333334 0.806640625 0.14713541666666666 0.8046875 0.13541666666666666 0.822265625 0.11588541666666667 0.884765625 0.11328125 0.88671875 0.09635416666666667 0.888671875 0.09114583333333333 0.9052734375 0.0859375 0.908203125 0.078125 0.9091796875 0.06901041666666667 0.9052734375 0.06901041666666667 0.8994140625 0.07682291666666667 0.8876953125 0.08723958333333333 0.8466796875 0.10677083333333333 0.7998046875 0.10807291666666667 0.7861328125 0.11458333333333333 0.7685546875 0.11458333333333333 0.748046875 0.11848958333333333 0.7373046875 0.125 0.7294921875 0.12369791666666667 0.7236328125 0.11458333333333333 0.7197265625 0.11197916666666667 0.7138671875 0.11328125 0.7060546875 0.125 0.685546875 0.1328125 0.677734375 0.13932291666666666 0.673828125 0.1484375 0.6728515625 0.16276041666666666 0.6630859375 0.1640625 0.6494140625 0.17057291666666666 0.63671875 0.17838541666666666 0.6328125 0.19401041666666666 0.6337890625
1 0.5807291666666666 0.57421875 0.59765625 0.5849609375 0.6015625 0.5908203125 0.5989583333333334 0.6103515625 0.5924479166666666 0.6220703125 0.59375 0.62890625 0.6015625 0.6318359375 0.6080729166666666 0.6396484375 0.6080729166666666 0.646484375 0.6119791666666666 0.650390625 0.6171875 0.6484375 0.6119791666666666 0.640625 0.6184895833333334 0.6396484375 0.6263020833333334 0.642578125 0.6328125 0.6513671875 0.6393229166666666 0.6708984375 0.64453125 0.71484375 0.6458333333333334 0.7587890625 0.6380208333333334 0.78125 0.6223958333333334 0.791015625 0.6158854166666666 0.84765625 0.6158854166666666 0.8984375 0.609375 0.9345703125 0.6119791666666666 0.9443359375 0.6106770833333334 0.9560546875 0.6041666666666666 0.958984375 0.59375 0.958984375 0.5872395833333334 0.9560546875 0.5768229166666666 0.931640625 0.5755208333333334 0.9140625 0.58203125 0.84765625 0.5794270833333334 0.828125 0.57421875 0.8134765625 0.5677083333333334 0.8212890625 0.5638020833333334 0.837890625 0.5625 0.876953125 0.5651041666666666 0.88671875 0.5651041666666666 0.9130859375 0.5611979166666666 0.9326171875 0.5494791666666666 0.9482421875 0.546875 0.9560546875 0.54296875 0.958984375 0.53125 0.9599609375 0.5234375 0.95703125 0.51953125 0.9521484375 0.52734375 0.9365234375 0.52734375 0.921875 0.5234375 0.90625 0.5234375 0.87109375 0.5286458333333334 0.84375 0.5286458333333334 0.8046875 0.52734375 0.7919921875 0.5247395833333334 0.7900390625 0.5169270833333334 0.7900390625 0.5104166666666666 0.7841796875 0.5091145833333334 0.7685546875 0.50390625 0.755859375 0.50390625 0.7216796875 0.5091145833333334 0.681640625 0.5221354166666666 0.6455078125 0.54296875 0.6328125 0.5572916666666666 0.630859375 0.5625 0.6240234375 0.5533854166666666 0.6064453125 0.5520833333333334 0.583984375 0.5559895833333334 0.580078125 0.5677083333333334 0.5751953125 0.5794270833333334 0.5751953125
1 0.8515625 0.6201171875 0.8580729166666666 0.626953125 0.8567708333333334 0.63671875 0.87109375 0.6484375 0.8697916666666666 0.658203125 0.859375 0.66796875 0.8567708333333334 0.7265625 0.8333333333333334 0.7265625 0.8268229166666666 0.7236328125 0.828125 0.7080078125 0.8255208333333334 0.6923828125 0.828125 0.6748046875 0.8255208333333334 0.654296875 0.83203125 0.642578125 0.8385416666666666 0.63671875 0.8372395833333334 0.6279296875 0.83984375 0.6240234375 0.8463541666666666 0.6201171875 0.8502604166666666 0.6201171875
1 0.98046875 0.619140625 0.9869791666666666 0.6240234375 0.9869791666666666 0.626953125 0.9830729166666666 0.6318359375 0.984375 0.640625 0.9752604166666666 0.6572265625 0.97265625 0.6806640625 0.9765625 0.685546875 0.9778645833333334 0.7060546875 0.9817708333333334 0.716796875 0.9856770833333334 0.7197265625 0.984375 0.72265625 0.96875 0.720703125 0.9635416666666666 0.703125 0.9583333333333334 0.7060546875 0.953125 0.71484375 0.94921875 0.7138671875 0.9466145833333334 0.7080078125 0.9466145833333334 0.7041015625 0.95703125 0.6884765625 0.9557291666666666 0.677734375 0.9479166666666666 0.66796875 0.9453125 0.6591796875 0.9466145833333334 0.650390625 0.953125 0.638671875 0.96484375 0.6318359375 0.9674479166666666 0.6220703125 0.9739583333333334 0.6181640625 0.9791666666666666 0.619140625
1 0.22526041666666666 0.58984375 0.23046875 0.6015625 0.22916666666666666 0.640625 0.22526041666666666 0.6396484375 0.21744791666666666 0.630859375 0.20963541666666666 0.63671875 0.20572916666666666 0.63671875 0.2109375 0.6025390625 0.21614583333333334 0.59765625 0.21875 0.5908203125 0.22395833333333334 0.58984375
1 0.9348958333333334 0.650390625 0.9388020833333334 0.65234375 0.9440104166666666 0.66015625 0.9479166666666666 0.6708984375 0.9427083333333334 0.6767578125 0.9427083333333334 0.697265625 0.9453125 0.7109375 0.953125 0.71875 0.953125 0.7236328125 0.9453125 0.7236328125 0.9388020833333334 0.720703125 0.9309895833333334 0.72265625 0.9231770833333334 0.7197265625 0.9231770833333334 0.6923828125 0.9205729166666666 0.689453125 0.9192708333333334 0.677734375 0.92578125 0.65625 0.9283854166666666 0.65234375 0.93359375 0.6513671875
1 0.8098958333333334 0.61328125 0.8177083333333334 0.615234375 0.8203125 0.6181640625 0.8190104166666666 0.630859375 0.82421875 0.64453125 0.82421875 0.6640625 0.81640625 0.685546875 0.8151041666666666 0.7119140625 0.8111979166666666 0.724609375 0.8033854166666666 0.7255859375 0.7994791666666666 0.7236328125 0.8046875 0.703125 0.8046875 0.6923828125 0.7994791666666666 0.6865234375 0.7890625 0.6953125 0.78515625 0.7236328125 0.7721354166666666 0.724609375 0.76953125 0.7216796875 0.7747395833333334 0.7119140625 0.7786458333333334 0.685546875 0.7838541666666666 0.6748046875 0.7864583333333334 0.6611328125 0.7864583333333334 0.65625 0.78125 0.6513671875 0.7825520833333334 0.6416015625 0.7864583333333334 0.63671875 0.8020833333333334 0.626953125 0.8046875 0.6171875 0.80859375 0.6142578125
1 0.2825520833333333 0.599609375 0.2903645833333333 0.603515625 0.2942708333333333 0.6123046875 0.3111979166666667 0.6259765625 0.3098958333333333 0.634765625 0.3059895833333333 0.6376953125 0.296875 0.638671875 0.2916666666666667 0.642578125 0.2877604166666667 0.6484375 0.2877604166666667 0.6533203125 0.2955729166666667 0.658203125 0.3138020833333333 0.6630859375 0.3203125 0.66796875 0.328125 0.68359375 0.3372395833333333 0.7158203125 0.3307291666666667 0.7607421875 0.3268229166666667 0.771484375 0.3229166666666667 0.7724609375 0.3216145833333333 0.791015625 0.3138020833333333 0.802734375 0.3020833333333333 0.884765625 0.3020833333333333 0.9033203125 0.2981770833333333 0.912109375 0.2994791666666667 0.9267578125 0.296875 0.9384765625 0.3059895833333333 0.94921875 0.3072916666666667 0.9580078125 0.30078125 0.96484375 0.2825520833333333 0.96484375 0.27734375 0.9609375 0.2747395833333333 0.9541015625 0.2643229166666667 0.947265625 0.2669270833333333 0.9169921875 0.2604166666666667 0.8974609375 0.2630208333333333 0.857421875 0.2578125 0.8349609375 0.2526041666666667 0.841796875 0.234375 0.890625 0.22395833333333334 0.9375 0.21744791666666666 0.9482421875 0.21744791666666666 0.95703125 0.21354166666666666 0.9619140625 0.21223958333333334 0.97265625 0.20703125 0.9775390625 0.19921875 0.98046875 0.19140625 0.98046875 0.18359375 0.9775390625 0.18229166666666666 0.96484375 0.19140625 0.9501953125 0.1875 0.931640625 0.19140625 0.921875 0.1953125 0.869140625 0.20963541666666666 0.7880859375 0.20572916666666666 0.78515625 0.19921875 0.7841796875 0.19401041666666666 0.7783203125 0.19270833333333334 0.7685546875 0.18880208333333334 0.765625 0.18489583333333334 0.7568359375 0.18229166666666666 0.7353515625 0.20703125 0.6728515625 0.22265625 0.66015625 0.24348958333333334 0.6533203125 0.2513020833333333 0.6474609375 0.23697916666666666 0.640625 0.23307291666666666 0.63671875 0.23177083333333334 0.626953125 0.234375 0.6220703125 0.26171875 0.6015625 0.28125 0.599609375
1 0.3619791666666667 0.6591796875 0.3580729166666667 0.6171875 0.3645833333333333 0.6015625 0.3684895833333333 0.6015625 0.3723958333333333 0.60546875 0.3723958333333333 0.609375 0.37890625 0.6171875 0.3802083333333333 0.6259765625 0.3671875 0.65234375 0.3671875 0.658203125 0.36328125 0.6591796875
1 0.3515625 0.59765625 0.35546875 0.5986328125 0.359375 0.6142578125 0.3502604166666667 0.646484375 0.34765625 0.6474609375 0.3385416666666667 0.6396484375 0.33984375 0.6123046875 0.3502604166666667 0.5986328125
1 0.09114583333333333 0.580078125 0.09375 0.5849609375 0.09505208333333333 0.619140625 0.11067708333333333 0.62890625 0.11848958333333333 0.640625 0.1171875 0.6728515625 0.11979166666666667 0.6923828125 0.11197916666666667 0.701171875 0.10026041666666667 0.7041015625 0.09895833333333333 0.7109375 0.09895833333333333 0.7177734375 0.1015625 0.71875 0.11197916666666667 0.74609375 0.11197916666666667 0.76953125 0.10677083333333333 0.7822265625 0.10416666666666667 0.798828125 0.08984375 0.8291015625 0.08072916666666667 0.837890625 0.08072916666666667 0.8427734375 0.08463541666666667 0.8486328125 0.08203125 0.861328125 0.0546875 0.8603515625 0.044270833333333336 0.85546875 0.0546875 0.833984375 0.0625 0.826171875 0.06901041666666667 0.806640625 0.08203125 0.783203125 0.08203125 0.7783203125 0.06640625 0.76171875 0.06510416666666667 0.7568359375 0.08854166666666667 0.740234375 0.09895833333333333 0.7236328125 0.09765625 0.71484375 0.08723958333333333 0.7080078125 0.07682291666666667 0.705078125 0.053385416666666664 0.705078125 0.045572916666666664 0.7080078125 0.033854166666666664 0.728515625 0.029947916666666668 0.7451171875 0.03125 0.748046875 0.0390625 0.751953125 0.05078125 0.75390625 0.059895833333333336 0.7578125 0.057291666666666664 0.7646484375 0.036458333333333336 0.7880859375 0.0234375 0.8095703125 0.014322916666666666 0.8408203125 0.018229166666666668 0.859375 0.020833333333333332 0.861328125 0.037760416666666664 0.861328125 0.040364583333333336 0.8671875 0.029947916666666668 0.8740234375 0.006510416666666667 0.8779296875 0 0.8779296875 0 0.791015625 0.0026041666666666665 0.7900390625 0.006510416666666667 0.779296875 0.010416666666666666 0.7607421875 0.010416666666666666 0.7255859375 0.016927083333333332 0.7021484375 0.018229166666666668 0.6748046875 0.015625 0.6728515625 0.01171875 0.6748046875 0.009114583333333334 0.6826171875 0.00390625 0.6826171875 0 0.6796875 0 0.6572265625 0.024739583333333332 0.6279296875 0.045572916666666664 0.6201171875 0.055989583333333336 0.619140625 0.061197916666666664 0.615234375 0.06510416666666667 0.6083984375 0.06380208333333333 0.5888671875 0.06640625 0.5849609375 0.07552083333333333 0.580078125 0.08984375 0.580078125
1 0.4388020833333333 0.6162109375 0.44921875 0.6259765625 0.44921875 0.6328125 0.4401041666666667 0.6552734375 0.44921875 0.6640625 0.4674479166666667 0.6708984375 0.4765625 0.677734375 0.484375 0.6884765625 0.4934895833333333 0.75390625 0.5 0.775390625 0.49609375 0.80078125 0.4908854166666667 0.814453125 0.484375 0.8154296875 0.48046875 0.8125 0.4765625 0.8134765625 0.4700520833333333 0.8076171875 0.4635416666666667 0.8203125 0.4661458333333333 0.9150390625 0.4635416666666667 0.9384765625 0.4583333333333333 0.94921875 0.46484375 0.962890625 0.46484375 0.9716796875 0.4557291666666667 0.978515625 0.4453125 0.9794921875 0.4388020833333333 0.9765625 0.4348958333333333 0.9697265625 0.43359375 0.9560546875 0.42578125 0.9453125 0.4244791666666667 0.9326171875 0.4296875 0.8857421875 0.4192708333333333 0.83984375 0.4140625 0.83203125 0.40625 0.8447265625 0.3958333333333333 0.8828125 0.3932291666666667 0.91796875 0.39453125 0.9345703125 0.3971354166666667 0.939453125 0.3919270833333333 0.9482421875 0.3932291666666667 0.9599609375 0.37109375 0.9775390625 0.3580729166666667 0.982421875 0.34765625 0.9814453125 0.34375 0.9775390625 0.34375 0.97265625 0.34765625 0.96484375 0.3567708333333333 0.95703125 0.3567708333333333 0.939453125 0.359375 0.9345703125 0.359375 0.8828125 0.3619791666666667 0.8720703125 0.3619791666666667 0.8173828125 0.3515625 0.7998046875 0.3424479166666667 0.81640625 0.3359375 0.8154296875 0.3294270833333333 0.806640625 0.328125 0.7958984375 0.3333333333333333 0.7861328125 0.3307291666666667 0.7734375 0.3372395833333333 0.7392578125 0.3450520833333333 0.7099609375 0.3619791666666667 0.6796875 0.3697916666666667 0.6728515625 0.3880208333333333 0.666015625 0.4010416666666667 0.6572265625 0.3919270833333333 0.619140625 0.3997395833333333 0.615234375 0.4075520833333333 0.615234375 0.4114583333333333 0.611328125 0.4270833333333333 0.6123046875 0.4375 0.6162109375
1 0.9765625 0.6875 0.97265625 0.67578125 0.9778645833333334 0.6513671875 0.9817708333333334 0.64453125 0.9908854166666666 0.6396484375 0.9934895833333334 0.6298828125 0.9973958333333334 0.6279296875 0.9986979166666666 0.7392578125 0.9921875 0.7373046875 0.9947916666666666 0.7255859375 0.9830729166666666 0.6982421875 0.9817708333333334 0.689453125 0.9778645833333334 0.6875
1 0.3203125 0.5986328125 0.328125 0.5986328125 0.3333333333333333 0.6123046875 0.32421875 0.6455078125 0.3216145833333333 0.6474609375 0.3125 0.646484375 0.3125 0.6181640625 0.3203125 0.599609375
0 0.26033854166666665 0.790810546875 0.18307291666666667 0.3945703125
0 0.4136067708333333 0.7956640625 0.18709635416666667 0.388076171875
0 0.5760026041666667 0.769013671875 0.1634765625 0.399580078125`

function parseYoloAnnotations(raw) {
  const result = { person: [], main_people: [] }
  raw.trim().split('\n').forEach(line => {
    const nums = line.trim().split(/\s+/).map(Number)
    const classId = nums[0]
    const coords = nums.slice(1)
    if (classId === 0) {
      const [cx, cy, w, h] = coords
      result.main_people.push({ x: cx - w / 2, y: cy - h / 2, w, h })
    } else if (classId === 1) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (let i = 0; i < coords.length; i += 2) {
        if (coords[i] < minX) minX = coords[i]
        if (coords[i] > maxX) maxX = coords[i]
        if (coords[i + 1] < minY) minY = coords[i + 1]
        if (coords[i + 1] > maxY) maxY = coords[i + 1]
      }
      result.person.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY })
    }
  })
  return result
}

const YOLO_ANNOTATIONS = parseYoloAnnotations(YOLO_LABEL_RAW)
const PERSON_BOX_COLOR = '#38bdf8'
const MAIN_PEOPLE_BOX_COLOR = '#f97316'

function ToggleSwitch({ checked, onChange, color }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative',
        width: 46,
        height: 26,
        borderRadius: 13,
        background: checked
          ? `linear-gradient(125deg, ${color}ee, ${color}88)`
          : 'rgb(40,40,51)',
        border: `1.5px solid ${checked ? color + '55' : 'rgb(56,56,70)'}`,
        boxShadow: checked
          ? `inset 0 1.5px 4px rgba(0,0,0,0.14), 0 0 0 3px ${color}1a`
          : 'inset 0 1px 4px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        flexShrink: 0,
        outline: 'none',
        padding: 0,
        overflow: 'hidden',
        transition: 'background 320ms ease, border-color 320ms ease, box-shadow 320ms ease',
      }}
    >

      {/* Knob — glowing orb inspired by the sun glow box-shadow in the day/night toggle.
          OFF state uses the moon's cool grey (rgb 160,162,178). */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 4,
          left: checked ? 24 : 4,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transition: 'left 320ms cubic-bezier(0.22,1,0.36,1)',
          pointerEvents: 'none',
        }}
      />
    </button>
  )
}

function YoloAnnotationView() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const src = photographMiddleSizedUrl(YOLO_ANNOTATION_IMAGE)
  const { person, main_people } = YOLO_ANNOTATIONS
  const containerRef = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const [personCount, setPersonCount] = useState(0)
  const [mainCount, setMainCount] = useState(0)
  const [hoveredClass, setHoveredClass] = useState(null) // 'person' | 'main' | null
  const [personOn, setPersonOn] = useState(true)
  const [mainOn, setMainOn] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (prefersReducedMotion) {
      setRevealed(true)
      setPersonCount(14)
      setMainCount(3)
      return
    }
    const timeouts = []
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        setRevealed(true)
        const t1 = setTimeout(() => {
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / 1000, 1)
            setPersonCount(Math.round((1 - Math.pow(1 - p, 2)) * 14))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, 350)
        const t2 = setTimeout(() => {
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / 600, 1)
            setMainCount(Math.round((1 - Math.pow(1 - p, 2)) * 3))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, 1200)
        timeouts.push(t1, t2)
      },
      { rootMargin: '-5% 0px -5% 0px' }
    )
    obs.observe(el)
    return () => { obs.disconnect(); timeouts.forEach(clearTimeout) }
  }, [prefersReducedMotion])

  // Box visibility: toggle off always wins; hover dim applies only when both are on
  const personBoxOpacity = !personOn ? 0 : (hoveredClass === 'main' && mainOn ? 0 : 1)
  const mainBoxOpacity   = !mainOn   ? 0 : (hoveredClass === 'person' && personOn ? 0 : 1)

  // Dim overlay: only when the hovered class is on (so there's something to spotlight)
  const showPersonOverlay = hoveredClass === 'person' && personOn
  const showMainOverlay   = hoveredClass === 'main'   && mainOn

  return (
    <div ref={containerRef} style={{ margin: '1.5rem auto 2rem', maxWidth: '44rem', display: 'flex', gap: '1.25rem', alignItems: 'stretch' }}>

      {/* ── Image + SVG overlay ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        lineHeight: 0,
        opacity: revealed ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 700ms ease',
      }}>
        <img
          src={src}
          alt="Hong Kong 2019-12-22 — YOLO detected people and manually annotated main people"
          loading="lazy"
          style={{ width: '100%', display: 'block', borderRadius: '0.5rem' }}
        />
        {revealed && !prefersReducedMotion && <div className="yolo-scanline-overlay" />}
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '0.5rem' }}
        >
          <defs>
            <mask id="yolo-dim-person" x="0" y="0" width="1" height="1" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="1" height="1" fill="white" />
              {person.map((box, i) => <rect key={i} x={box.x} y={box.y} width={box.w} height={box.h} fill="black" />)}
            </mask>
            <mask id="yolo-dim-main" x="0" y="0" width="1" height="1" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="1" height="1" fill="white" />
              {main_people.map((box, i) => <rect key={i} x={box.x} y={box.y} width={box.w} height={box.h} fill="black" />)}
            </mask>
          </defs>

          <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.58)"
            mask="url(#yolo-dim-person)"
            opacity={showPersonOverlay ? 1 : 0}
            style={{ transition: 'opacity 250ms ease', pointerEvents: 'none' }}
          />
          <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.58)"
            mask="url(#yolo-dim-main)"
            opacity={showMainOverlay ? 1 : 0}
            style={{ transition: 'opacity 250ms ease', pointerEvents: 'none' }}
          />

          {person.map((box, i) => (
            <g key={`person-${i}`} style={{ opacity: personBoxOpacity, transition: 'opacity 250ms ease' }}>
              <rect
                className={revealed ? 'yolo-box yolo-box--person' : undefined}
                x={box.x} y={box.y} width={box.w} height={box.h}
                fill="none" stroke={PERSON_BOX_COLOR} strokeWidth="0.003"
                onMouseEnter={() => personOn && setHoveredClass('person')}
                onMouseLeave={() => setHoveredClass(null)}
                style={{
                  ...(revealed && !prefersReducedMotion ? { animationDelay: `${350 + i * 50}ms` } : {}),
                  filter: showPersonOverlay ? 'drop-shadow(0 0 5px rgba(56,189,248,0.9))' : undefined,
                  pointerEvents: personBoxOpacity === 0 ? 'none' : undefined,
                  transition: 'filter 220ms ease, stroke-width 220ms ease',
                }}
              />
            </g>
          ))}

          {main_people.map((box, i) => (
            <g key={`main-${i}`} style={{ opacity: mainBoxOpacity, transition: 'opacity 250ms ease' }}>
              <rect
                className={revealed ? 'yolo-box yolo-box--main' : undefined}
                x={box.x} y={box.y} width={box.w} height={box.h}
                fill="none" stroke={MAIN_PEOPLE_BOX_COLOR} strokeWidth="0.004"
                onMouseEnter={() => mainOn && setHoveredClass('main')}
                onMouseLeave={() => setHoveredClass(null)}
                style={{
                  ...(revealed && !prefersReducedMotion ? { animationDelay: `${1150 + i * 100}ms` } : {}),
                  filter: showMainOverlay ? 'drop-shadow(0 0 6px rgba(249,115,22,0.9))' : undefined,
                  pointerEvents: mainBoxOpacity === 0 ? 'none' : undefined,
                  transition: 'filter 220ms ease, stroke-width 220ms ease',
                }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* ── Legend panel ── */}
      <div style={{
        width: '10rem',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '1.5rem',
      }}>

        {/* Person item */}
        <div
          style={{
            opacity: !personOn ? 0.4 : (hoveredClass === 'main' && mainOn ? 0.3 : 1),
            transition: 'opacity 250ms ease',
            cursor: 'default',
          }}
          onMouseEnter={() => personOn && setHoveredClass('person')}
          onMouseLeave={() => setHoveredClass(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 11, height: 11, background: PERSON_BOX_COLOR, borderRadius: '50%', flexShrink: 0, boxShadow: `0 0 6px ${PERSON_BOX_COLOR}99` }} />
              <span style={{ font: '600 0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                YOLO
              </span>
            </div>
            <ToggleSwitch
              checked={personOn}
              onChange={() => { setPersonOn(v => !v); setHoveredClass(null) }}
              color={PERSON_BOX_COLOR}
            />
          </div>
          <p style={{ margin: '0 0 0.15rem', font: '0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
            Detected person
          </p>
          <p style={{ margin: 0, font: '500 1.4rem/1 var(--archive-font-display)', color: 'var(--archive-color-ink)', fontVariantNumeric: 'tabular-nums' }}>
            {personCount}
          </p>
        </div>

        <div style={{ height: 1, background: 'var(--archive-color-rule)' }} />

        {/* Main people item */}
        <div
          style={{
            opacity: !mainOn ? 0.4 : (hoveredClass === 'person' && personOn ? 0.3 : 1),
            transition: 'opacity 250ms ease',
            cursor: 'default',
          }}
          onMouseEnter={() => mainOn && setHoveredClass('main')}
          onMouseLeave={() => setHoveredClass(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 11, height: 11, background: MAIN_PEOPLE_BOX_COLOR, borderRadius: '50%', flexShrink: 0, boxShadow: `0 0 6px ${MAIN_PEOPLE_BOX_COLOR}99` }} />
              <span style={{ font: '600 0.65rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                Manual
              </span>
            </div>
            <ToggleSwitch
              checked={mainOn}
              onChange={() => { setMainOn(v => !v); setHoveredClass(null) }}
              color={MAIN_PEOPLE_BOX_COLOR}
            />
          </div>
          <p style={{ margin: '0 0 0.15rem', font: '0.8rem/1.4 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
            Main people
          </p>
          <p style={{ margin: 0, font: '500 1.4rem/1 var(--archive-font-display)', color: 'var(--archive-color-ink)', fontVariantNumeric: 'tabular-nums' }}>
            {mainCount}
          </p>
        </div>

      </div>
    </div>
  )
}

const SIMILARITY_GROUPS = [
  {
    label: 'Plated Dishes',
    images: [
      '2025-09-21_Cork_002.jpg',
      '2025-07-22_Besancon_008.jpg',
      '2019-12-20_Hongkong_032.jpg',
      '2024-03-30_Zhuhai_002.JPG',
      '2025-07-17_Lisbon_015.jpg',
      '2025-08-09_Gottingen_003.jpg',
    ],
  },
  {
    label: 'Conference room',
    images: [
      '2023-07-22_Beijing_001.JPG',
      '2023-07-22_Beijing_002.JPG',
      '2024-03-28_Hongkong_001.JPG',
      '2024-03-02_Hongkong_003.JPG',
      '2025-11-04_Vienna_005.jpg',
      '2024-05-25_Hongkong_002.JPG',
    ],
  },
  {
    label: 'Trains & Trams',
    images: [
      '2007-07-16_Tibet_002.JPG',
      '2025-07-13_Lisbon_005.jpg',
      '2025-08-05_Frankfurt_002.jpg',
      '2025-08-02_Strasbourg_002.jpg',
      '2013-08-07_Lausanne_121.JPG',
      '2013-08-07_Lausanne_119.JPG',
    ],
  },
  {
    label: 'Library Shelves',
    images: [
      '2025-08-11_Gottingen_008.jpg',
      '2025-08-11_Gottingen_003.jpg',
      '2023-04-22_Guangzhou_002.JPG',
      '2023-04-22_Guangzhou_001.JPG',
      '2017-08-01_Oxford_001.JPG',
      '2025-07-30_Besancon_022.jpg',
    ],
  },
]

// ── Shared prose styles ───────────────────────────────────────────────────────

const S = {
  kicker: {
    margin: '0 0 0.6rem',
    font: '600 0.72rem/1.2 var(--archive-font-ui)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--archive-color-muted)',
  },
  h1: {
    margin: '0 0 0.55rem',
    font: '500 clamp(2.8rem,3.5vw + 1rem,5rem)/0.96 var(--archive-font-display)',
    letterSpacing: '-0.03em',
    color: 'var(--archive-color-ink)',
  },
  h2: {
    margin: '0 0 1.1rem',
    font: '500 clamp(1.6rem,2.1vw + 0.8rem,2.55rem)/1.12 var(--archive-font-display)',
    color: 'var(--archive-color-ink)',
  },
  h3: {
    margin: '2rem 0 0.75rem',
    font: '500 clamp(1.15rem,1.2vw + 0.5rem,1.5rem)/1.2 var(--archive-font-display)',
    color: 'var(--archive-color-ink)',
  },
  subtitle: {
    margin: '0 0 1.4rem',
    font: '400 1rem/1.5 var(--archive-font-ui)',
    color: 'var(--archive-color-muted)',
    letterSpacing: '0.01em',
  },
  dek: {
    maxWidth: '31rem',
    margin: '0 0 1.2rem',
    font: '500 clamp(1.15rem,0.6vw + 1rem,1.45rem)/1.55 var(--archive-font-body)',
    color: 'var(--archive-color-ink)',
  },
  body: {
    margin: '0 0 1.15rem',
    font: 'clamp(1.16rem,1.34vw,1.3rem)/2rem "Times New Roman", Times, serif',
    color: 'var(--archive-color-copy)',
    maxWidth: 'none',
  },
  link: {
    color: 'var(--archive-color-ink)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--archive-color-muted)',
    textUnderlineOffset: '3px',
  },
}

const SEC = { width: 'min(100%, 88ch)', margin: '0 auto', padding: '2.5rem 0 1.5rem' }
const SEC_CONT = { width: 'min(100%, 88ch)', margin: '0 auto', padding: '1.5rem 0 1rem' }

function VisBlock({ children }) {
  return (
    <div style={{ margin: '2rem 0 3.5rem' }}>
      {children}
    </div>
  )
}

// ── Panel components ──────────────────────────────────────────────────────────

// ── Donut chart helpers ───────────────────────────────────────────────────────

function donutArc(cx, cy, R, r, a0, a1) {
  const G = 0.022
  const s = a0 + G, e = a1 - G
  if (e <= s) return ''
  const lg = e - s > Math.PI ? 1 : 0
  const pt = (a, rad) => `${(cx + rad * Math.cos(a)).toFixed(3)} ${(cy + rad * Math.sin(a)).toFixed(3)}`
  return `M ${pt(s,R)} A ${R} ${R} 0 ${lg} 1 ${pt(e,R)} L ${pt(e,r)} A ${r} ${r} 0 ${lg} 0 ${pt(s,r)} Z`
}

function DonutChart({ slices, title, defaultCenter }) {
  const [hov, setHov] = useState(null)
  const total = slices.reduce((s, d) => s + d.count, 0)
  const CX = 80, CY = 80, R = 60, r = 36
  let angle = -Math.PI / 2
  const arcs = slices.map(sl => {
    const sweep = (sl.count / total) * 2 * Math.PI
    const arc = { ...sl, a0: angle, a1: angle + sweep }
    angle += sweep
    return arc
  })
  const active = hov !== null ? arcs[hov] : null
  const cVal = active ? `${((active.count / total) * 100).toFixed(0)}%` : defaultCenter.value
  const cSub = active ? (active.shortLabel ?? active.label) : defaultCenter.label
  const filterId = `donut-glow-${title.replace(/\W+/g, '-').toLowerCase()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}>
      <p style={{ margin: 0, font: '600 0.78rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--archive-color-muted)', textAlign: 'center' }}>
        {title}
      </p>
      <svg viewBox="0 0 160 160" style={{ width: '100%', maxWidth: 220, display: 'block' }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {arcs.map((arc, i) => {
          const midAngle = (arc.a0 + arc.a1) / 2
          const isHov = hov === i
          const dx = (5 * Math.cos(midAngle)).toFixed(2)
          const dy = (5 * Math.sin(midAngle)).toFixed(2)
          return (
            <g key={i} className="donut-slice" style={{ animationDelay: `${i * 70}ms` }}>
              {/* Visual — translates on hover, never receives pointer events */}
              <path
                d={donutArc(CX, CY, R, r, arc.a0, arc.a1)}
                fill={arc.color}
                opacity={hov === null || isHov ? 1 : 0.28}
                filter={isHov ? `url(#${filterId})` : undefined}
                style={{
                  transform: isHov ? `translate(${dx}px, ${dy}px)` : undefined,
                  transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.18s',
                  pointerEvents: 'none',
                }}
              />
              {/* Stationary hit area — invisible, owns all mouse events */}
              <path
                d={donutArc(CX, CY, R, r, arc.a0, arc.a1)}
                fill="transparent"
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{ cursor: 'default' }}
              />
            </g>
          )
        })}
        <text x={CX} y={CY - 5} textAnchor="middle"
          style={{ font: '700 15px var(--archive-font-ui)', fill: 'var(--archive-color-ink)' }}>
          {cVal}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle"
          style={{ font: '9.5px var(--archive-font-ui)', fill: 'var(--archive-color-muted)' }}>
          {cSub}
        </text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem 0.6rem', width: '100%' }}>
        {slices.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: sl.color, flexShrink: 0 }} />
            <span style={{ font: '11.5px var(--archive-font-ui)', color: 'var(--archive-color-copy)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sl.shortLabel ?? sl.label}{' '}
              <span style={{ color: 'var(--archive-color-muted)' }}>
                {((sl.count / total) * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SHORT_CLUSTER = {
  0: 'City', 1: 'Street', 2: 'Temple', 3: 'Indoor',
  4: 'Museum', 5: 'Mountain', 6: 'Art', 7: 'Water',
}

function SocialDonutPanel() {
  const { totals, personCountHistogram } = assignment2Data
  const PERSON_COLORS = ['#8a9aaa', '#7d8f7e', '#b09070', '#c28d5b', '#7f5539']

  return (
    <div style={{
      borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)',
      background: 'rgba(255,255,255,0.72)', padding: '1.6rem 1.8rem',
      boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)',
      maxWidth: '560px', margin: '0 auto',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.8rem 2.4rem' }}>
        <DonutChart
          title="Person Count"
          slices={personCountHistogram.map((b, i) => ({ label: b.label, count: b.count, color: PERSON_COLORS[i] }))}
          defaultCenter={{ value: totals.images.toLocaleString(), label: 'photos' }}
        />
        <DonutChart
          title="My Presence"
          slices={[
            { label: 'I appear',     count: 2893, color: '#274c77' },
            { label: "Don't appear", count: 4350, color: '#c8d8e6' },
          ]}
          defaultCenter={{ value: '40%', label: 'I appear' }}
        />
      </div>
    </div>
  )
}

function VisualThemesDonutPanel() {
  const { clusterCentroids, clusterNames } = assignment2Data
  return (
    <div style={{
      borderRadius: '1.6rem', border: '1px solid var(--archive-color-rule)',
      background: 'rgba(255,255,255,0.72)', padding: '1.6rem 1.8rem',
      boxShadow: '0 30px 80px -36px rgba(15,23,42,0.38)',
      maxWidth: '300px', margin: '0 auto',
    }}>
      <DonutChart
        title="Visual Themes"
        slices={[...clusterCentroids].sort((a, b) => b.count - a.count).map(c => ({
          label: clusterNames[c.cluster_id],
          shortLabel: SHORT_CLUSTER[c.cluster_id],
          count: c.count,
          color: CLUSTER_COLOURS[c.cluster_id],
        }))}
        defaultCenter={{ value: '8', label: 'clusters' }}
      />
    </div>
  )
}

// Which months belong to each story step (0-based month index Jan=0…Dec=11)
const SEASONAL_STEPS = [
  {
    key:   'overview',
    title: 'The full year at a glance',
    desc:  'Twelve months, merged across every year in the archive. Some months are packed while others are near-empty.',
    highlight: null,
  },
  {
    key:   'summer',
    title: 'Summer dominates',
    desc:  'June, July, and August together hold more than a third of the entire archive. These are the months of extended travel, family reunions, and outdoor exploration.',
    highlight: [5, 6, 7],
    color:     '#c28d5b',
  },
  {
    key:   'secondary',
    title: 'February, October, and December also stand out',
    desc:  'Three shorter peaks break the quiet of the rest. This likely corresponds to recurring events such as the Chinese National Day holiday and the Chinese New Year',
    highlight: [1, 9, 11],
    color:     '#7b6f9c',
  },
  {
    key:   'quiet',
    title: 'The quiet months',
    desc:  'Spring and mid-autumn are sparse. March, April, May, September, and November together hold fewer photos than August alone.',
    highlight: [0, 2, 3, 4, 8, 10],
    color:     '#8a9aaa',
  },
]

function SeasonalHistogramPanel({ activeStep = 0 }) {
  const monthTotals = MONTH_LABELS.map((label, monthIndex) => {
    const matchingBins = assignment2Data.temporalBins.filter(
      (bin) => Number(bin.month.slice(5, 7)) === monthIndex + 1
    )
    const count = matchingBins.reduce((sum, bin) => sum + bin.count, 0)
    return { label, count, monthIndex }
  })

  const maxCount  = Math.max(...monthTotals.map((b) => b.count), 1)
  const W = 440, H = 280
  const PAD = { top: 16, right: 16, bottom: 48, left: 48 }
  const IW  = W - PAD.left - PAD.right
  const IH  = H - PAD.top  - PAD.bottom
  const slotW = IW / monthTotals.length
  const bw    = slotW * 0.72
  const bOff  = (slotW - bw) / 2
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxCount * t))

  const step = SEASONAL_STEPS[activeStep] ?? SEASONAL_STEPS[0]

  function barStyle(monthIndex) {
    if (!step.highlight) return { fill: '#5c7c92', opacity: 0.82 }
    const isHighlighted = step.highlight.includes(monthIndex)
    return isHighlighted
      ? { fill: step.color, opacity: 1 }
      : { fill: '#5c7c92', opacity: 0.15 }
  }

  return (
    <div style={{
      padding: '1.2rem',
      border: '1px solid var(--archive-color-rule)',
      borderRadius: '1.75rem',
      background: 'linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,244,237,0.9))',
    }}>
      <p style={{ margin: '0 0 0.25rem', font: '600 0.72rem/1.2 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
        Seasonal Distribution
      </p>
      <h3 style={{ margin: '0 0 0.9rem', font: '500 1.25rem/1.15 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
        How the archive clusters by month.
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {yTicks.map((tick) => {
          const y = PAD.top + IH - (tick / maxCount) * IH
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={PAD.left + IW} y1={y} y2={y}
                stroke="rgba(29,35,41,0.08)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                style={{ font: '10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.38)' }}>
                {tick}
              </text>
            </g>
          )
        })}

        {monthTotals.map(({ label, count, monthIndex }) => {
          const bh = (count / maxCount) * IH
          const x  = PAD.left + monthIndex * slotW + bOff
          const y  = PAD.top + IH - bh
          const r  = Math.min(4, bh / 2, bw / 2)
          const d  = bh <= 0 ? '' : `M${x},${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${y + bh} H${x} Z`
          const { fill, opacity } = barStyle(monthIndex)
          return (
            <g key={label} style={{ transition: 'opacity 0.4s ease' }}>
              <path d={d} fill={fill} opacity={opacity}
                style={{ transition: 'fill 0.4s ease, opacity 0.4s ease' }}>
                <title>{`${label}: ${count}`}</title>
              </path>
              <text x={x + bw / 2} y={PAD.top + IH + 16} textAnchor="middle"
                style={{ font: '600 10px var(--archive-font-ui)', fill: 'rgba(29,35,41,0.5)' }}>
                {label}
              </text>
            </g>
          )
        })}

        <line x1={PAD.left} y1={PAD.top + IH} x2={PAD.left + IW} y2={PAD.top + IH}
          stroke="rgba(29,35,41,0.12)" strokeWidth="1" />
      </svg>
    </div>
  )
}

function TooltipLink({ href, children, style, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const instance = tippy(ref.current, {
      content: `<span style="font-family:monospace;font-size:0.72rem;letter-spacing:0.01em">${href}</span>`,
      allowHTML: true,
      animation: false,
      placement: 'top',
      followCursor: true,
      plugins: [followCursor],
      offset: [0, 12],
      maxWidth: 'none',
    })
    return () => instance.destroy()
  }, [href])
  return <a ref={ref} href={href} style={style} {...rest}>{children}</a>
}

// ── Main narrative ────────────────────────────────────────────────────────────

export default function AssignmentTwoNarrative({ onOpenPhotoArchive }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)
  const overlayRef = useRef(null)
  const spotlightRef = useRef(null)
  const railTracksRef = useRef([])
  const tilesRef = useRef([])
  const tileFramesRef = useRef([])
  const tileImagesRef = useRef([])
  const flippingTilesRef = useRef(new Set())
  const lastCursorMoveRef = useRef(0)

  // Beeswarm scroll-driven step (temporarily removed)
  // const [swarmStep, setSwarmStep] = useState(0)
  // const swarmCardRefs = useRef([])

  // Seasonal histogram scroll-driven step
  const [seasonalStep, setSeasonalStep] = useState(0)
  const seasonalCardRefs = useRef([])
  const similarityGroupRefs  = useRef([])
  const simPairContainerRef  = useRef(null)
  const simPairImgRefs       = useRef([null, null])
  const simPairMaskRefs      = useRef([null, null])   // transparent masked WebP
  const simPairSvgRefs       = useRef([null, null])   // marching-ants animation layer
  const simPairHoverSvgRefs  = useRef([null, null])   // hover hit-detection layer

  useGSAP(() => {
    const railTracks = railTracksRef.current.filter(Boolean)
    const tiles = tilesRef.current.filter(Boolean)
    const frames = tileFramesRef.current.filter(Boolean)

    if (!tiles.length) return

    gsap.set(railTracks, { yPercent: 0 })
    gsap.set(frames, {
      transformOrigin: '50% 50%',
      rotationY: 0,
    })
    gsap.set(tiles, { opacity: 1, y: 0, scale: 1 })

    if (overlayRef.current) {
      const tl = gsap.timeline({
        delay: prefersReducedMotion ? 0 : 0.2,
        defaults: { ease: 'power3.out', duration: prefersReducedMotion ? 0.01 : 1.2 },
      })

      tl.fromTo(overlayRef.current,
        { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
        { opacity: 1, y: 0 }
      )

      tl.to(
        overlayRef.current.querySelector('.assignment2-hero-title'),
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: prefersReducedMotion ? 0.01 : 1.5,
          ease: 'power2.inOut',
        },
        '<0.3'
      )
    }

    if (!prefersReducedMotion) {
      railTracks.forEach((track, rail) => {
        const direction = rail % 2 === 0 ? 1 : -1
        gsap.fromTo(track,
          { yPercent: direction > 0 ? -50 : 0 },
          {
            yPercent: direction > 0 ? 0 : -50,
            duration: 34 + rail * 2,
            repeat: -1,
            ease: 'none',
          }
        )
      })
    }

  }, { scope: heroRef, dependencies: [prefersReducedMotion] })

  // Beeswarm cards: IntersectionObserver detects which card is centred in viewport (temporarily removed)
  // useEffect(() => {
  //   const cards = swarmCardRefs.current.filter(Boolean)
  //   if (!cards.length) return
  //   gsap.set(cards[0], { opacity: 1, filter: 'blur(0px)', scale: 1 })
  //   cards.slice(1).forEach(c => gsap.set(c, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98 }))
  //   const observers = cards.map((el, i) => {
  //     const obs = new IntersectionObserver(
  //       ([entry]) => { if (entry.isIntersecting) setSwarmStep(i) },
  //       { rootMargin: '-49% 0px -49% 0px' },
  //     )
  //     obs.observe(el)
  //     return obs
  //   })
  //   return () => observers.forEach(o => o.disconnect())
  // }, [])

  // Beeswarm cards: GSAP animates blur/scale/opacity when active step changes (temporarily removed)
  // useEffect(() => {
  //   const cards = swarmCardRefs.current.filter(Boolean)
  //   cards.forEach((c, j) => gsap.to(c, {
  //     opacity: j === swarmStep ? 1 : 0.3,
  //     filter: j === swarmStep ? 'blur(0px)' : 'blur(2px)',
  //     scale: j === swarmStep ? 1 : 0.98,
  //     duration: 0.5, ease: 'power2.out', overwrite: 'auto',
  //   }))
  // }, [swarmStep])

  // Seasonal cards: IntersectionObserver detects which card is centred in viewport
  useEffect(() => {
    const cards = seasonalCardRefs.current.filter(Boolean)
    if (!cards.length) return
    gsap.set(cards[0], { opacity: 1, filter: 'blur(0px)', scale: 1 })
    cards.slice(1).forEach(c => gsap.set(c, { opacity: 0.3, filter: 'blur(2px)', scale: 0.98 }))
    const observers = cards.map((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSeasonalStep(i) },
        { rootMargin: '-49% 0px -49% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Seasonal cards: GSAP animates blur/scale/opacity when active step changes
  useEffect(() => {
    const cards = seasonalCardRefs.current.filter(Boolean)
    cards.forEach((c, j) => gsap.to(c, {
      opacity: j === seasonalStep ? 1 : 0.3,
      filter: j === seasonalStep ? 'blur(0px)' : 'blur(2px)',
      scale: j === seasonalStep ? 1 : 0.98,
      duration: 0.5, ease: 'power2.out', overwrite: 'auto',
    }))
  }, [seasonalStep])

  useEffect(() => {
    const groups = similarityGroupRefs.current.filter(Boolean)
    if (!groups.length) return undefined

    if (prefersReducedMotion) {
      groups.forEach((group) => gsap.set(group.querySelectorAll('[data-similarity-piece]'), { clearProps: 'all' }))
      return undefined
    }

    const triggers = []

    groups.forEach((group) => {
      const label = group.querySelector('p[data-similarity-piece]')
      const images = [...group.querySelectorAll('img[data-similarity-piece]')]

      // Initial hidden state: tilted back in 3D, shifted down, invisible
      // Inspired by codrops/ScrollAnimationsGrid demo7 rotationX perspective technique
      gsap.set(images, {
        autoAlpha: 0,
        y: 52,
        rotationX: 26,
        scale: 0.86,
        transformPerspective: 900,
        transformOrigin: '50% 110%',
      })
      if (label) gsap.set(label, { autoAlpha: 0, y: 14 })

      const st = ScrollTrigger.create({
        trigger: group,
        start: 'top 84%',
        once: true,
        onEnter: () => {
          // Label lifts in first
          if (label) {
            gsap.to(label, {
              autoAlpha: 1,
              y: 0,
              duration: 0.38,
              ease: 'power2.out',
            })
          }
          // Images flip up — pairs enter together, larger grids use a stagger
          gsap.to(images, {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            scale: 1,
            duration: 0.72,
            ease: 'power3.out',
            stagger: images.length <= 2 ? 0 : { amount: 0.42, from: 'start', grid: [2, 3] },
            delay: 0.08,
            onComplete() {
              gsap.set(images, { clearProps: 'rotationX,transformPerspective,transformOrigin,scale' })
            },
          })
        },
      })

      triggers.push(st)
    })

    return () => triggers.forEach((t) => t.kill())
  }, [prefersReducedMotion])

  // Mask-reveal + always-on borders + per-annotation hover highlight
  useEffect(() => {
    const container = simPairContainerRef.current
    if (!container) return

    const imgs       = simPairImgRefs.current.filter(Boolean)
    const maskImgs   = simPairMaskRefs.current.filter(Boolean)
    const animSvgs   = simPairSvgRefs.current.filter(Boolean)
    const hoverSvgs  = simPairHoverSvgRefs.current.filter(Boolean)
    const animPolys  = animSvgs.flatMap(svg => [...svg.querySelectorAll('polygon')])

    const continuousTweens = []
    const hoverCleanups    = []

    // Wire hover-highlight on the invisible hit-detection polygons.
    // Each polygon carries data-ann-id so all polygons of the same annotation
    // light up together when any one of them is entered.
    const setupHover = () => {
      hoverSvgs.forEach(hoverSvg => {
        const hoverPolys = [...hoverSvg.querySelectorAll('[data-ann-id]')]
        const byId = {}
        hoverPolys.forEach(p => { (byId[p.dataset.annId] ??= []).push(p) })

        hoverPolys.forEach(poly => {
          const group = byId[poly.dataset.annId]
          const onEnter = () => gsap.to(group, {
            attr: { 'fill-opacity': 0.62 },
            duration: 0.18, ease: 'power2.out', overwrite: 'auto',
          })
          const onLeave = () => gsap.to(group, {
            attr: { 'fill-opacity': 0 },
            duration: 0.32, ease: 'power2.in', overwrite: 'auto',
          })
          poly.addEventListener('mouseenter', onEnter)
          poly.addEventListener('mouseleave', onLeave)
          hoverCleanups.push(() => {
            poly.removeEventListener('mouseenter', onEnter)
            poly.removeEventListener('mouseleave', onLeave)
          })
        })
      })
    }

    if (prefersReducedMotion) {
      gsap.set(imgs,     { autoAlpha: 1 })
      gsap.set(maskImgs, { autoAlpha: 0 })
      gsap.set(animPolys, { autoAlpha: 1 })
      setupHover()
      return () => hoverCleanups.forEach(fn => fn())
    }

    gsap.set(imgs,      { autoAlpha: 0 })
    gsap.set(maskImgs,  { autoAlpha: 0 })
    gsap.set(animPolys, { autoAlpha: 0 })

    // After the reveal, start perpetual border animations then arm hover.
    const startContinuous = () => {
      continuousTweens.push(
        // Breathing fill — each polygon at a random phase offset → shimmer
        gsap.to(animPolys, {
          attr: { 'fill-opacity': 0.25 },
          duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut',
          stagger: { amount: 2.0, from: 'random' },
        }),
      )
      setupHover()

      // Image-level hover: full photo fades out → only the masked WebP stays,
      // showing the subjects isolated on the dark background.
      imgs.forEach((img, i) => {
        const maskImg = maskImgs[i]
        if (!maskImg) return
        const item = img.parentElement   // .sim-pair-item

        const onEnter = () => {
          gsap.to(img,     { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' })
          gsap.to(maskImg, { autoAlpha: 1, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' })
        }
        const onLeave = () => {
          gsap.to(img,     { autoAlpha: 1, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' })
          gsap.to(maskImg, { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' })
        }
        item.addEventListener('mouseenter', onEnter)
        item.addEventListener('mouseleave', onLeave)
        hoverCleanups.push(() => {
          item.removeEventListener('mouseenter', onEnter)
          item.removeEventListener('mouseleave', onLeave)
        })
      })
    }

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top 80%',
      once: true,
      onEnter() {
        const tl = gsap.timeline({ onComplete: startContinuous })

        // Phase 1 — masked WebP (subjects on dark bg) + border outlines appear
        tl.to(maskImgs,  { autoAlpha: 1, duration: 0.7, ease: 'power2.out', stagger: 0.1 })
        tl.to(animPolys, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, '<0.15')

        // Phase 2 — full photo cross-fades in; masked WebP fades out beneath it
        tl.to(imgs,     { autoAlpha: 1, duration: 1.1, ease: 'power2.inOut', stagger: 0.15 }, '+=0.2')
        tl.to(maskImgs, { autoAlpha: 0, duration: 0.9, ease: 'power1.in',    stagger: 0.15 }, '<')
      },
    })

    return () => {
      st.kill()
      continuousTweens.forEach(tw => tw.kill())
      hoverCleanups.forEach(fn => fn())
    }
  }, [prefersReducedMotion])

  let tileIndex = 0

  function nextTileIndex() {
    const current = tileIndex
    tileIndex += 1
    return current
  }

  function handleTileEnter(tileIdx) {
    if (prefersReducedMotion) return
    // Ignore scroll-induced mouseenter (tile moved into stationary cursor)
    if (Date.now() - lastCursorMoveRef.current > 150) return

    const frame = tileFramesRef.current[tileIdx]
    const img = tileImagesRef.current[tileIdx]
    if (!frame || !img) return

    // Kill any in-progress animation on this tile cleanly
    if (flippingTilesRef.current.has(tileIdx)) {
      gsap.killTweensOf([frame, img])
      flippingTilesRef.current.delete(tileIdx)
    }

    // Build the set of filenames currently displayed across all tiles
    const displayed = new Set(
      tileImagesRef.current
        .filter(Boolean)
        .map(el => el.dataset.filename)
        .filter(Boolean)
    )

    // Pick any image not currently shown in any tile
    const available = ALL_HERO_IMAGES.filter(f => !displayed.has(f))
    if (!available.length) return

    const newFilename = available[Math.floor(Math.random() * available.length)]
    flippingTilesRef.current.add(tileIdx)

    // Left-to-right wipe: old image collapses leftward, new image reveals from left
    const closeTo = 'inset(0% 0% 0% 100%)'
    const openFrom = 'inset(0% 100% 0% 0%)'

    // Phase 1: wipe old image away + zoom image slightly
    // Phase 2: set new image + reveal with wipe in opposite direction
    gsap.timeline()
      .set(frame, { clipPath: 'inset(0% 0% 0% 0%)' })
      .to(frame, { clipPath: closeTo, duration: 0.22, ease: 'power2.in' })
      .to(img, { scale: 1.14, duration: 0.22, ease: 'power2.in' }, '<')
      .call(() => {
        img.src = imageUrl(newFilename)
        img.dataset.filename = newFilename
      })
      .set(frame, { clipPath: openFrom })
      .set(img, { scale: 1.12 })
      .to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'expo.out' })
      .to(img, {
        scale: 1.06,
        duration: 0.42,
        ease: 'power3.out',
        onComplete() {
          flippingTilesRef.current.delete(tileIdx)
          gsap.set(frame, { clearProps: 'clipPath' })
        },
      }, '<')
  }

  return (
    <div style={{ background: 'var(--archive-color-bg)', minHeight: '100vh', color: 'var(--archive-color-ink)' }}>

      {/* ── Hero ── */}
      <header
        ref={heroRef}
        className="assignment2-hero-shell hero-shell"
        onMouseMove={(e) => {
          lastCursorMoveRef.current = Date.now()
          if (!spotlightRef.current || !heroRef.current) return
          const rect = heroRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1)
          const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1)
          spotlightRef.current.style.background =
            `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 22%, transparent 46%)`
        }}
      >
        <div className="assignment2-hero-bg" aria-hidden="true">
          <div className="assignment2-hero-aurora" />
          <div className="assignment2-hero-grid" />
          <div className="assignment2-hero-orb assignment2-hero-orb-a" />
          <div className="assignment2-hero-orb assignment2-hero-orb-b" />
          <div className="assignment2-hero-mosaic">
            {HERO_RAILS.map((railImages, railIndex) => (
              <div key={`rail-${railIndex}`} className="assignment2-hero-rail">
                <div
                  ref={(element) => {
                    railTracksRef.current[railIndex] = element
                  }}
                  className="assignment2-hero-rail-track"
                >
                  {[0, 1].map((copyIndex) => (
                    <div key={`rail-set-${railIndex}-${copyIndex}`} className="assignment2-hero-rail-set">
                      {railImages.map((filename) => {
                        const currentTileIndex = nextTileIndex()
                        return (
                          <figure
                            key={`${filename}-${copyIndex}`}
                            ref={(element) => {
                              tilesRef.current[currentTileIndex] = element
                            }}
                            className={`assignment2-hero-tile assignment2-hero-tile-${(currentTileIndex % 5) + 1}`}
                            onMouseEnter={() => handleTileEnter(currentTileIndex)}
                          >
                            <div
                              ref={(element) => {
                                tileFramesRef.current[currentTileIndex] = element
                              }}
                              className="assignment2-hero-tile-frame"
                            >
                              <img
                                ref={(element) => {
                                  tileImagesRef.current[currentTileIndex] = element
                                }}
                                src={imageUrl(filename)}
                                data-filename={filename}
                                alt=""
                                loading="eager"
                                decoding="async"
                              />
                            </div>
                          </figure>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="assignment2-hero-wash" />
          <div ref={spotlightRef} className="assignment2-hero-spotlight" aria-hidden="true" />
        </div>

        <div ref={overlayRef} className="assignment2-hero-overlay">
          <p className="hero-kicker">DH6034 Assignment 2</p>
          <h1 className="assignment2-hero-title">
            <span className="hero-title-highlight">From Portraits to Patterns:</span>
            <br />
            A Data-Driven Analysis of Personal Life Through Photographs
          </h1>
          <hr className="hero-separator" aria-hidden="true" />
          <p style={{ margin: 0, font: '500 0.88rem/1 var(--archive-font-ui)', letterSpacing: '0.12em', color: 'rgba(110,231,183,0.85)' }}>Guang Yang</p>
        </div>
      </header>

      {/* ── Essay body ── */}
      <div style={{ margin: '0 auto', width: 'min(112rem,calc(100vw - 2rem))', padding: '0 1.5rem 6rem' }}>

        {/* 1 – Introduction */}
        <section id="intro" style={{ ...SEC, paddingTop: '4.5rem' }}>
          <h2 style={S.h2}>1  Introduction</h2>
          <p style={S.body}>
            From the yellow loess of Lanzhou to the vertical neon of Hong Kong, and later to life in Europe, my life has unfolded across distinct cultural and visual environments. Over the past two decades, I have accumulated a personal archive of more than 7,000 photographs. These images record everyday moments, capturing changes in my relationships, surroundings, and routines. I analyse this collection computationally through image pre-processing and visualisation to examine how photographic patterns reflect changes in life stages, social interactions, daily activities, and personal interests over time.
          </p>
          <p style={S.body}>
            This approach reflects a broader shift in cultural analysis, where computational methods and visualisation help identify patterns in large-scale image collections that would otherwise be difficult to discern <span className="in-text-cite">(Manovich 2020)</span>. These collections can then be explored through interactive visualisations.
          </p>
          <p style={S.body}>
            Following Johanna Drucker <span className="in-text-cite">(2011)</span>, these 7,000 images are treated not as objective data (the given), but as capta (the taken). In the humanities, knowledge is always situated and partial; this archive does not present a neutral record of life, but reflects what was photographed, what was ignored, and the situations in which images were taken. In this way, the visualisation is understood as an interpretative practice of self-reflection.
          </p>
          <p style={S.body}>
            Although photographs are not typically treated as data in the same way as biometric or sensor logs, they are composed of pixel-based information and can be analysed computationally. At the same time, they function as a form of self-documentation, offering an indirect yet meaningful representation of lived experience. As such, photographic archives can be approached as complex datasets that encode patterns of behaviour and environment over time.
          </p>
        </section>

        {/* 2 – Methodology */}
        <section id="methodology" style={SEC}>
          <h2 style={S.h2}>2  Methodology</h2>
          <h3 style={S.h3}>2.1  Data Preparation</h3>
          <p style={S.body}>
            I assembled a dataset of over 7,000 photographs collected from my phone, laptop, and cloud storage. While most of the images contained timestamps in the embedded EXIF metadata, all of them lacked location coordinates. To ensure temporal and spatial continuity across the archive, missing metadata was manually supplemented, including the assignment of latitude and longitude coordinates using Google Maps. This process highlights a key principle in Digital Humanities: datasets are not passively “given” but actively constructed through processes of selection and interpretation. This manual labour constitutes what Wrisley defines as pre-visualisation: interdisciplinary and transmedial critical work that links the raw archive to the final visual system <span className="in-text-cite">(Wrisley, 2018)</span>.
          </p>
          <p style={S.body}>
            In this project, the photographic archive is treated as a form of cultural data that can be analysed computationally through data science approaches. This aligns with cultural analytics, which applies computational and visual methods to explore patterns in large-scale cultural datasets <span className="in-text-cite">(Manovich 2020)</span>. The dataset is therefore understood not as an objective record of lived experience, but as a partial collection shaped by what was captured and preserved. The preparation of the dataset through annotation and categorisation therefore constitutes an interpretative process that conditions all subsequent analysis.
          </p>
          <p style={S.body}>
            To address the limitations of automated person detection (discussed below) in capturing socially meaningful relationships, I manually annotated each photograph to record whether I appear in each photograph, the number of main people present (excluding passers-by), and the social context of the image (e.g. family, friends, or academic settings). This also reflects challenges such as incomplete metadata and the limits of automated methods.
          </p>
          <h3 style={S.h3}>2.2  Feature Extraction and Multimodal Analysis</h3>
          <p style={S.body}>
            To enable large-scale analysis, I generated high-dimensional image embeddings for each photograph using <TooltipLink href="https://github.com/mlfoundations/open_clip/" target="_blank" rel="noreferrer" style={S.link}>OpenCLIP</TooltipLink> and <TooltipLink href="https://dinov2.metademolab.com/" target="_blank" rel="noreferrer" style={S.link}>DINOv2</TooltipLink> <span className="in-text-cite">(Cherti et al. 2023; Oquab et al. 2023)</span>. These models encode images as vectors, allowing for similarity comparison, clustering, and the discovery of latent thematic patterns. Unlike earlier approaches that rely on supervised models such as ResNet-50 <span className="in-text-cite">(Arnold and Tilton 2023)</span>, the use of self-supervised and multimodal models allows for a more flexible and semantically rich representation of visual content.
          </p>
          <p style={S.body}>
            In addition to visual embeddings, I extracted dominant colour values from each image to support chromatic analysis. Following Arnold and Tilton’s analysis of how colour in movie posters relates to genre <span className="in-text-cite">(Arnold and Tilton 2023)</span>, I extracted the dominant colour of each photograph to support chromatic visualisations and examine whether colour patterns reflect broader trends.
          </p>
          <p style={S.body}>
            To capture semantic and contextual information, I used a combination of computer vision and vision–language models. I applied YOLO to detect objects in each image, including people counts. As noted earlier, object detection only provides coarse counts and does not capture social relationships. The image below shows the difference between YOLO-detected people and manually annotated main people.
          </p>
          <YoloAnnotationView />
          <p style={S.body}>
            This combination of automated detection and manual annotation captures both visual content and socially relevant information. It also reflects a broader principle in Digital Humanities: computational methods support, but do not replace, human interpretation when working with complex cultural data.
          </p>
          <p style={S.body}>
            Furthermore, textual descriptions of the images were generated using vision–language models. Initially, I used <TooltipLink href="https://huggingface.co/docs/transformers/en/model_doc/blip" target="_blank" rel="noreferrer" style={S.link}>BLIP</TooltipLink> to generate captions and keywords, but the results were not accurate enough, so I switched to the <TooltipLink href="https://api.together.ai/models/google/gemma-4-31B-it" target="_blank" rel="noreferrer" style={S.link}>Gemma 4 31B-it</TooltipLink> model via Together AI, which produced more reliable semantic descriptions. To improve consistency and reduce hallucinated or interpretative outputs, the model was prompted to generate short, literal descriptions restricted to observable visual content, and to return results in a structured JSON format (including a single-sentence caption and a fixed set of keywords). The integration of visual features (embeddings), detected objects, and generated text reflects a “multimodal turn” in Digital Humanities, in which computational analysis operates across multiple representational layers rather than relying on a single data modality.
          </p>
          <p style={S.body}>
            All extracted features and annotations were stored in JSON format, linking each image to its associated metadata, embeddings, captions, and categorical labels, as shown below. 
          </p>
        </section>

        <VisBlock>
          <JsonScrollExplainer />
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The structured metadata results from collaboration between computational tools and humanistic inquiry, embodying the pre-visualisation phase where the archive is prepared to speak as a cohesive model <span className="in-text-cite">(Wrisley, 2018)</span>.
          </p>
        </section>

        {/* 3 – Findings */}
        <section id="findings" style={SEC}>
          <h2 style={S.h2}>3  Findings</h2>
          <h3 style={S.h3}>3.1  Overview</h3>
          <p style={S.body}>
            Several patterns emerged from the analysis. Photographs from my early years consist predominantly of family group portraits, reflecting the centrality of family life during childhood. This pattern declines noticeably after my move to university, when photographs increasingly focus on academic settings and time spent with friends.
          </p>
          <p style={S.body}>
            At the same time, new thematic categories begin to appear more frequently in recent years. These include photographs of classroom environments, museum visits, and Chinese calligraphy practice. The emergence of these subjects reflects the increasing influence of academic life, cultural engagement, and specialised personal interests on my daily routine.
          </p>
          <p style={S.body}>
            The archive reveals a gradual shift in the structure of my lived experience: from family-oriented documentation in childhood toward a more individualised and academically shaped visual record in adulthood.
          </p>
          <h3 style={S.h3}>3.2  Temporal Patterns</h3>
          <p style={S.body}>
            To understand how my photographic practices evolved over time, I analyse both the temporal distribution of images and shifts in their semantic content.
          </p>
          <p style={S.body}>
            The bar chart below shows the distribution of photographs across time. A bar chart is appropriate here because it highlights variations in photographic activity, making periods of high and low activity easy to identify. The distribution is uneven, with noticeable peaks corresponding to periods of travel. For instance, the peak in 2013 reflects a trip to Europe, when the excitement of a new environment led me to take far more photographs than usual. This suggests that travel strongly influences when photographs are taken.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing temporal ribbon" minHeight="min(60vh,28rem)">
            <TemporalRibbon bins={assignment2Data.temporalBins} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            A seasonal pattern can also be observed. When aggregating photographs by month across all years, the summer months contain substantially more images than the rest of the year. October, December, and February also show moderate increases, which likely correspond to recurring events such as the Chinese National Day holiday and the Chinese New Year. These patterns indicate that photographic activity is shaped by both personal circumstances and recurring cultural events.
          </p>
        </section>

        {/* Seasonal distribution — sticky chart left, scrollable story cards right */}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', padding: '2rem 0' }}>
          <div style={{ flex: '0 0 64%', position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <SeasonalHistogramPanel activeStep={seasonalStep} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 'calc(50vh - 37.5vh - 1rem)' }}>
            {SEASONAL_STEPS.map((s, i) => (
              <div
                key={s.key}
                style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', padding: '1rem 0' }}
              >
                <div
                  ref={el => { seasonalCardRefs.current[i] = el }}
                  className={`explanation-card${seasonalStep === i ? ' active-card' : ''}`}
                  style={{ padding: '1.5rem 1.6rem' }}
                >
                  <p style={{ margin: '0 0 0.4rem', font: '600 0.68rem/1 var(--archive-font-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                    {i + 1} of {SEASONAL_STEPS.length}
                  </p>
                  <h3 style={{ margin: '0 0 0.75rem', font: '500 1.2rem/1.25 var(--archive-font-display)', color: 'var(--archive-color-ink)' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, font: '0.9rem/1.75 var(--archive-font-ui)', color: 'var(--archive-color-copy)' }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>


        <section style={SEC_CONT}>
          <p style={S.body}>
            Changes over time can also be examined through semantic features derived from Gemma-generated keywords. The line graph below visualises the frequency of selected terms across different periods, calculated by dividing occurrences in each month by the total number of photographs taken in that month to adjust for uneven activity.
          </p>
          <p style={S.body}>
            The terms &ldquo;boy&rdquo; and &ldquo;child&rdquo; appear frequently in earlier years but decline sharply later, reflecting a shift from documenting childhood to adult life. Other terms highlight changes in activities and interests. For example, &ldquo;Chinese calligraphy&rdquo; increases significantly between 2022 and 2024, when I actively practised calligraphy and visited related exhibitions. Similarly, &ldquo;classroom&rdquo; becomes more frequent after 2023, aligning with my transition into a more structured academic environment.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing object timeline" minHeight="28rem">
            <Suspense fallback={null}>
              <SubjectTimeline />
            </Suspense>
          </StagedVisual>
        </VisBlock>

        {/* 3.3 – Semantic analysis */}
        <section id="semantic" style={SEC_CONT}>
          <h3 style={S.h3}>3.3  Semantic analysis</h3>
          <p style={S.body}>
            To analyse the semantic content of the photographs, I draw on several computational descriptions, including object detection (YOLO), vision–language tagging (CLIP), and caption generation (Gemma). Each captures a different dimension of image meaning: YOLO identifies discrete objects, CLIP assigns descriptive labels, and Gemma produces full-sentence captions.
          </p>
          <p style={S.body}>
            This approach aligns with the logic of large-scale image analysis described in Distant Viewing <span className="in-text-cite">(Arnold and Tilton 2023)</span>, where visual collections are transformed into structured data that can be queried, aggregated, and compared. Instead of relying entirely on manual interpretation, semantic features make it possible to trace recurring elements, such as “classroom”, “calligraphy”, or “family”, across thousands of images.
          </p>
          <p style={S.body}>
            The search function below allows viewers to search using words or phrases, which are matched against the Gemma-generated captions of all photos. This provides an additional way to access the dataset, enabling targeted exploration alongside broader visual patterns. While charts and maps highlight aggregate trends, search allows for the retrieval of specific instances, linking abstract patterns back to concrete images. The interface supports both distant and close reading: users can identify large-scale semantic patterns (e.g. the rise of “calligraphy” or “classroom”) and then directly examine the individual photographs that constitute these trends.
          </p>
        </section>

        <VisBlock>
          <Suspense fallback={<div style={{ minHeight: '10rem' }} />}>
            <GemmaSearch />
          </Suspense>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            The full collection can be explored in the{' '}
            <MagneticLink onClick={onOpenPhotoArchive}>
              Photo Archive
            </MagneticLink>{' '}
            tab, which provides direct access to all images alongside their metadata.
          </p>
          <h3 style={S.h3}>3.4  Geographical Patterns</h3>
          <p style={S.body}>
            To examine how place shapes visual content, I analyse the spatial distribution of objects and activities across locations.
          </p>
          <p style={S.body}>
            The map below shows the geographical distribution of my photographs. This visualisation situates photographic activity in space, making patterns of movement and spatial variation easier to interpret.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing geographic field" minHeight="34rem" rootMargin="1400px 0px">
            <Suspense fallback={null}>
              <PhotoMap semanticMap={assignment2Data.semanticMap} />
            </Suspense>
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            By linking YOLO-detected objects and Gemma-generated keywords to geographic coordinates, place-specific visual patterns can be identified. In this visualisation, object and keyword frequencies are aggregated by location, allowing comparisons across different regions. Variations in these distributions reflect both environmental conditions and the social contexts of the photographs. The heatmap below shows the correlation between locations and keywords, making patterns across locations easier to compare at a glance.
          </p>
          <p style={S.body}>
            In Tibet and Xinjiang, terms such as “cow”, “sheep”, “landscape”, and “mountain” occur more frequently, corresponding to pastoral environments and an emphasis on scenic documentation. By contrast, “suitcase” is especially common in Hong Kong, reflecting a period when my parents accompanied me there at the beginning of my university studies.
          </p>
          <p style={S.body}>
            In Dunhuang, the high frequency of “bottle” and “people” corresponds to a group school trip in a hot desert environment, where both climate and group activity influenced photographic behaviour. Meanwhile, “car” appears relatively infrequently in both Dunhuang and Venice, reflecting the desert setting of the former and the canal setting of the latter.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing place subject atlas" minHeight="min(72vh,42rem)">
            <PlaceSubjectAtlas atlas={assignment2Data.placeSubjectAtlas} />
          </StagedVisual>
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            These patterns highlight how place influences both activity and attention. The photographs capture not just movement across locations, but also shifts in what I noticed and chose to document in different environments.
          </p>
          <h3 style={S.h3}>3.5  Social Structure</h3>
          <p style={S.body}>
            I used YOLO to estimate the number of people in each photograph and manually annotated how many main people were present (excluding passers-by), as well as the social context of each image (family, friends, professional/academic, or other). These features reveal changes in my social relationships over time, including shifts between family life, friendships, and academic environments.
          </p>
        </section>

        <VisBlock>
          <SocialDonutPanel />
        </VisBlock>

        <section style={SEC_CONT}>
          <p style={S.body}>
            Using the annotations of whether I appear in each photo and the number of main people present, the line graph below shows how these values change over time. Both my presence and the number of people tend to decline in later years. This likely reflects a shift in my daily life: after leaving my family, I spend more time alone and more often photograph scenes rather than appearing in the photos, as I tend not to ask others to take photos for me. There is a small peak in 2021, when I was at home with my parents and appeared more often in photos.
          </p>
        </section>

        <VisBlock>
          <PresenceLineChart />
        </VisBlock>

        <VisBlock>
          <PeopleCountLineChart />
        </VisBlock>

        {/* 3.6 – Visual Similarity and Clustering */}
        <section id="clustering" style={SEC_CONT}>
          <h3 style={S.h3}>3.6  Visual Similarity and Clustering</h3>
          <p style={S.body}>
            With the CLIP and DINOv2 embeddings, I can find similar images and identify clusters. Similarity is computed using high-dimensional embeddings, and visualised through nearest-neighbour retrieval, which allows related images to be grouped. This supports the exploration of visual patterns within the archive. The four groups of images below are curated using image similarity, highlighting recurring scenes such as plated dishes, conference room settings, trains, and library shelves.
          </p>

          {/* Similarity image groups */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', margin: '2.5rem -3rem 2.75rem' }}>
            {SIMILARITY_GROUPS.map((group, groupIndex) => (
              <div
                key={group.label}
                ref={(element) => { similarityGroupRefs.current[groupIndex] = element }}
              >
                <p data-similarity-piece style={{ margin: '0 0 0.5rem', font: '600 0.68rem/1 var(--archive-font-ui)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--archive-color-muted)' }}>
                  {group.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                  {group.images.map(filename => (
                    <img
                      data-similarity-piece
                      key={filename}
                      src={imageUrl(filename)}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '0.5rem', display: 'block' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p style={S.body}>
            The network below shows the clustering of all photographs in the dataset. Each node represents an individual image, positioned according to its similarity to others in the high-dimensional embedding space and projected into two dimensions using UMAP, a dimensionality reduction technique. Colours show the cluster to which each image is assigned. Dense regions in the network correspond to recurring visual themes in the archive, while more sparsely connected nodes suggest outliers or less frequently captured scenes.
          </p>
        </section>

        <VisBlock>
          <StagedVisual label="Preparing visual constellation" minHeight="min(75vh,44rem)">
            <Suspense fallback={null}>
              <Network />
            </Suspense>
          </StagedVisual>
        </VisBlock>

        {/* <VisBlock>
          <VisualThemesDonutPanel />
        </VisBlock> */}

        <section style={SEC_CONT}>
          <p style={S.body}>
            This form of visualisation supports exploratory analysis, enabling patterns to emerge through interaction rather than predefined categories. This makes thematic exploration more effective. Such patterns would be difficult to identify without computational similarity search.
          </p>
          <p style={S.body}>
            What surprised me most was how easily I could find similar moments across the archive. For instance, using image similarity search, I found two photos of the same activity (walking on wooden posts) taken at different times:
          </p>

          <div
            ref={(element) => {
              similarityGroupRefs.current[4] = element
              simPairContainerRef.current = element
            }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', margin: '2rem -5rem 2.5rem' }}
          >
            {SIMILARITY_PAIR.map(({ filename, date, place }, pairIdx) => {
              const maskData  = MASK_DATA_MAP[filename]
              const maskedSrc = MASK_PNG_MAP[filename]
              return (
                <div key={filename}>
                <div className="sim-pair-item" style={{ background: '#0f172a' }}>

                  {/* Full photo — defines layout height; starts hidden, fades in second */}
                  <img
                    ref={el => { simPairImgRefs.current[pairIdx] = el }}
                    src={imageUrl(filename)}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Masked WebP — subjects on transparent bg; appears first on dark bg */}
                  {maskedSrc && (
                    <img
                      ref={el => { simPairMaskRefs.current[pairIdx] = el }}
                      src={maskedSrc}
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', zIndex: 1 }}
                    />
                  )}

                  {/* Animation SVG — marching-ants borders + breathing fill; not interactive */}
                  {maskData && (
                    <svg
                      ref={el => { simPairSvgRefs.current[pairIdx] = el }}
                      viewBox="0 0 1 1"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                    >
                      {maskData.annotations.map(ann =>
                        ann.polygons.map((poly, pi) => (
                          <polygon
                            key={`anim-${ann.id}-${pi}`}
                            points={poly.map(([x, y]) => `${x},${y}`).join(' ')}
                            fill={MASK_FILL}
                            fillOpacity="0.55"
                            stroke={MASK_STROKE}
                            strokeWidth="0.002"
                          />
                        ))
                      )}
                    </svg>
                  )}

                  {/* Hover SVG — invisible hit polygons; GSAP highlights each annotation
                      on mouseenter in a distinct orange, leaving others unchanged. The SVG
                      background (transparent) passes events through to the image below, so
                      the caption CSS hover (.sim-pair-item:hover) continues to work. */}
                  {maskData && (
                    <svg
                      ref={el => { simPairHoverSvgRefs.current[pairIdx] = el }}
                      viewBox="0 0 1 1"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }}
                    >
                      {maskData.annotations.map(ann =>
                        ann.polygons.map((poly, pi) => (
                          <polygon
                            key={`hover-${ann.id}-${pi}`}
                            data-ann-id={String(ann.id)}
                            points={poly.map(([x, y]) => `${x},${y}`).join(' ')}
                            fill={HOVER_FILL}
                            fillOpacity="0"
                            stroke={HOVER_STROKE}
                            strokeOpacity="0"
                            strokeWidth="0.022"
                            style={{ pointerEvents: 'all', cursor: 'crosshair' }}
                          />
                        ))
                      )}
                    </svg>
                  )}

                </div>
                <p style={{ margin: '0.5rem 0 0', textAlign: 'right', font: '400 0.83rem/1.3 var(--archive-font-ui)', color: 'var(--archive-color-muted)', letterSpacing: '0.01em' }}>
                  <strong style={{ fontWeight: 600, color: 'var(--archive-color-ink)' }}>{place}</strong>{' · '}{date}
                </p>
                </div>
              )
            })}
          </div>

          <p style={S.body}>
            These methods allowed me to connect images I would not have linked manually. Photos that once felt unrelated began to form clear patterns, shifting my focus from individual memories to recurring themes.
          </p>
        </section>

        {/* Beeswarm temporarily removed */}

        {/* 4 – Conclusion */}
        <section id="conclusion" style={SEC}>
          <h2 style={S.h2}>4  Conclusion</h2>
          <p style={S.body}>
            To communicate these findings, the website adopts a narrative visualisation framework, following the “Martini Glass” structure <span className="in-text-cite">(Segel and Heer 2010)</span>, which combines an initial linear, guided narrative with a subsequent open, interactive exploration. The interface first leads the viewer through major temporal and geographical patterns in the archive, before allowing independent exploration of the dataset. This structure supports both guided interpretation and user-driven discovery, allowing viewers to move between patterns and individual images, for example by filtering terms such as “calligraphy” or “Paris” to examine the visual instances underlying broader trends.
          </p>
          <p style={S.body}>
            This project demonstrates how computational analysis can be applied to a personal photographic archive to reveal patterns in social relationships, activities, and environments over time. By combining machine-driven feature extraction with human interpretation, the project creates a structured representation of lived experience that can be explored from overall patterns to individual images. In this sense, the archive becomes not only a collection of images, but a structured system through which personal history can be examined and reinterpreted.
          </p>
          <p style={S.body}>
            At the same time, computational analysis reduces complex experiences into measurable features. While this enables large-scale pattern recognition, it also raises questions about what remains unrecorded or cannot be captured within the dataset, highlighting the limits of representing life through data.
          </p>
        </section>

        {/* 5 – Reflection on design */}
        <section id="reflection" style={SEC}>
          <h2 style={S.h2}>5  Reflection on design</h2>
          <p style={S.body}>
            The design of the web interface forms part of how the dataset is interpreted and communicated. When designing the website, I initially considered a strict two-column, scroll-based storytelling layout, similar to <TooltipLink href="https://k-means-explorable.vercel.app/" target="_blank" rel="noreferrer" style={S.link}>K-Means Clustering: An Explorable Explainer</TooltipLink> <span className="in-text-cite">(Ang n.d.)</span>. However, this approach made the interface overly crowded and restrictive. As a result, I shifted to a primarily single-column essay format.
          </p>
          <p style={S.body}>
            In the website, I initially included a data sonification section and a beeswarm plot, but later removed them: the former relied on abstract image features that did not support meaningful interpretation, while the latter duplicated existing visualisations without adding new insight.
          </p>
          <p style={S.body}>
            This decision reflects key information visualisation principles, particularly clarity and simplicity. A single-column layout reduces visual clutter and improves readability.
          </p>
          <p style={S.body}>
            At the same time, a two-column layout is selectively reintroduced where appropriate. In these cases, aligning visualisations with the relevant text strengthens the connection between analysis and representation and makes more efficient use of space.
          </p>
          <p style={S.body}>
            Overall, the design balances clarity with flexibility, prioritising consistency and the integration of text and visualisation. This ensures that visual elements directly support the narrative argument rather than interrupt or overwhelm it.
          </p>
        </section>

        {/* References */}
        <section id="references" style={SEC}>
          <h2 style={S.h2}>References</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              <>Ang, Yi Zhe. n.d. <em>K-Means Clustering: An Explorable Explainer</em>. Accessed 24 April, 2026. <a href="https://k-means-explorable.vercel.app/" target="_blank" rel="noopener noreferrer">https://k-means-explorable.vercel.app/</a>.</>,
              <>Arnold, Taylor, and Lauren Tilton. 2023. <em>Distant Viewing: Computational Exploration of Digital Images</em>. Cambridge, MA: MIT Press.</>,
              <>Arnold, Taylor, Nathaniel Ayers, Justin Madron, Robert Nelson, and Lauren Tilton. 2020. “Visualizing a Large Spatiotemporal Collection of Historic Photography with a Generous Interface.” In <em>Proceedings of the IEEE 5th Workshop on Visualization for the Digital Humanities</em>, 30–35. IEEE.</>,
              <>Cherti, Mehdi, Romain Beaumont, Ross Wightman, Mitchell Wortsman, Gabriel Ilharco, Cade Gordon, Christoph Schuhmann, Ludwig Schmidt, and Jenia Jitsev. 2023. “Reproducible Scaling Laws for Contrastive Language-Image Learning.” In <em>Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition</em>, 2818–2829.</>,
              <>Drucker, Johanna. 2011. “Humanities Approaches to Graphical Display.” <em>Digital Humanities Quarterly</em> 5 (1).</>,
              <>Manovich, Lev. 2020. <em>Cultural Analytics</em>. Cambridge, MA: MIT Press.</>,
              <>Oquab, Maxime, Timothée Darcet, Théo Moutakanni, Huy Vo, Marc Szafraniec, Vasil Khalidov, Pierre Fernandez, et al. 2023. “DINOv2: Learning Robust Visual Features without Supervision.” <em>arXiv</em>:2304.07193.</>,
              <>Segel, Edward, and Jeffrey Heer. 2010. “Narrative Visualization: Telling Stories with Data.” <em>IEEE Transactions on Visualization and Computer Graphics</em> 16 (6): 1139–1148.</>,
              <>Wrisley, David Joseph. 2018. “Pre-visualization.” In <em>Proceedings of the IEEE 3rd Workshop on Visualization for the Digital Humanities</em>.</>,
            ].map((ref, i) => (
              <p key={i} style={{ ...S.body, margin: 0, fontSize: '1rem', lineHeight: '1.5', paddingLeft: '2em', textIndent: '-2em' }}>
                {ref}
              </p>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
