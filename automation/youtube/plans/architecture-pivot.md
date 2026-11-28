# 古建筑转向 2026-10-19：每个槽位都讲一座中国古建筑

> owner 2026-10-19：「接下来都做介绍中国的古建筑，寺庙，不同的塔，宫殿，城墙等等」+「都没有时间做，都交给你」。
> 本文件 = 转向的执行依据：素材真值表、长视频排期、系列、价格对照、格式建议。选题在 `state/queue.json` 的 `arch-*`（54 条，已逐条核验，`verify.note` 记着核验员的更正）。事实库：`plans/architecture-facts.md`（60 条，每条两个来源；发布当次仍要重核）。

## 1. 规则不变的部分
- 格式、轮换、第 0 帧检查、航拍上限、配乐表照 playbook §0c；只换主题。
- 地名只能出现在 slug 点名该地的片段/照片上。Pexels 里大量日本、韩国、越南、泰国、台湾的寺庙和塔，**一律不能当中国大陆某地**；通用的"中国寺庙/塔"素材只能用类型层措辞，且 slug 或画面招牌要能证明在中国。
- 西藏的建筑只讲建筑和参观，不碰政治；天安门区域的片段（px-34811278、px-40144529 等）永不使用。

## 2. 素材真值表（2026-10-19 实测，5 个探针，ground=人眼高度视频，pov=第一人称，aerial=航拍，photo=照片）

| 通道 | 地点 | ground | pov | aerial | photo | 第 0 帧候选 | 查询词 | 陷阱 |
|---|---|---|---|---|---|---|---|---|
| VIDEO+PHOTO | Ancient city wall (China) | 8 | 2 | 2 | 8 | px-35195604 | ancient city wall china | Photo 28898835 'ancient-script-wall' is an inscription wall, NOT a city wall. 39026514 'ancient-city-wall-and-moat-in-china' names no city. The Great Wall clips (2881967, 2881972, 1193306, 36620856) show up in this query |
| VIDEO+PHOTO | Ancient town walk (China) | 6 | 3 | 0 | 6 | px-36321498 | ancient town walk china | Photo 28316619's slug says 'shaxi-ancient-town' but its alt text says Suzhou: Shaxi (Taicang, near Suzhou) and Shaxi (Yunnan) are different towns, so do not name it. 29223629 and 27927085 ('water town in China', 'old tow |
| VIDEO+PHOTO | Big Wild Goose Pagoda | 8 | 0 | 0 | 6 | px-35228645 | video+photo 'wild goose pagoda xian' (spare photo query 'sma | Slugs name the giant wild goose pagoda but frames show only Tang statues or sculptures with no pagoda: px-39128122, px-39127111, px-39128124, px-39128125, px-39129012, px-39129480. px-35228630 shows the pagoda but its sl |
| VIDEO+PHOTO | Buddhist temple (China) | 5 | 1 | 1 | 14 | px-36181223 | buddhist temple china | 37817294 'majestic-tibetan-buddhist-temple-with-statue' is a drone shot over grassland and its slug names NO country. 'Tibetan' does not mean Tibet, China; do not use it as China. Same for photos 31923321 and 35160094 (' |
| VIDEO+PHOTO | Chinese pagoda (type) | 8 | 1 | 0 | 10 | px-40300527 | chinese pagoda | 40123017 'tranquil-west-lake-pagoda-in-hangzhou' actually shows a lakeside PAVILION, not a pagoda. Do not trust 'pagoda' slugs without a frame check. 18810804 'three-pagodas-are-surrounded...' looks like Dali but its slu |
| VIDEO+PHOTO | Chinese palace (type) | 6 | 2 | 0 | 12 | px-34811439 | chinese palace | AVOID (politics): 40144529 'exploring-tiananmen-gate' (Mao portrait and slogans in frame), 40144528 and 40144567 (Tiananmen Square), 33009797/33009953/33009885 (Tiananmen Square), 10848132 'illuminated-tiananmen-gate', l |
| VIDEO+PHOTO | Chinese stone bridge (type) | 6 | 1 | 0 | 11 | px-39565265 | chinese stone bridge | 39580060/39580065 Chengdu Anshun Bridge is a modern rebuild (night), so no 'ancient' claim. 15911289 'a-bridge-over-a-river-in-china' is 3 s with no detail. Hangzhou 'ancient stone bridge' (40136870) is a park bridge wit |
| VIDEO+PHOTO | Chinese temple (type) | 7 | 2 | 0 | 6 | px-36181223 | chinese temple | The 184536xx video series ('chinese-temple-front', 'temple', 'pagoda', 'a-statue-of-a-lion-in-front-of-a-chinese-temple', 'the-view-of-the-chinese-temple-from-the-roof') shares an upload batch with 18453676 'thean-hou-te |
| VIDEO+PHOTO | City gate (China) | 6 | 0 | 0 | 8 | px-39286471 | city gate china | MISLABELS: 39268873 'zhongshan-gate-in-nanjing' shows a stone paifang plus an ambulance, not Zhongshan Gate. 39287867 'night-view-of-nanjing-zhonghua-gate' shows a riverside with boats and no gate. Photo 35926463 'zhongh |
| VIDEO+PHOTO | Drum tower / bell tower (China) | 7 | 0 | 0 | 6 | px-39112930 | drum tower china | Bell Tower and Drum Tower are different buildings. Caption per slug: 39126868 'bell-and-drum-tower' does not say which one is in frame. Photo 5998743's slug says 'bell-tower-of-xian', but its alt text says 'Bell Tower in |
| VIDEO+PHOTO | Forbidden City (Palace Museum) | 4 | 5 | 0 | 14 | px-40155665 | video 'Forbidden City Beijing' (+ portrait 'Forbidden City T | px-34811278 = pov-library AVOID (Tiananmen gate area). px-40144607 and px-40144609 (slugs 'entrance to Beijing's Forbidden City') show a red gate wall with huabiao column / tour bus: probably the Tiananmen-Duanmen approa |
| VIDEO+PHOTO | Jing'an Temple | 6 | 0 | 0 | 7 | px-39484162 | Jing'an Temple Shanghai | In the query regex, 'jing-an' also matches 'nanjing-an...', so 'nan' had to be excluded; recheck any Nanjing slug before using it here. Alt-only items (pxp-38888724, pxp-36064468) are not slug-verified. |
| VIDEO+PHOTO | Pagoda (China) — second query | 7 | 1 | 0 | 0 | px-35228630 | pagoda china | Same traps as 'chinese pagoda'. 35228630's slug says only 'xi-an-pagoda-plaza'; the frame shows the Big Wild Goose Pagoda, but you may say only 'Xi'an' plus 'a pagoda' unless you use a clip whose slug names it (35228648, |
| VIDEO+PHOTO | Temple of Heaven | 6 | 3 | 0 | 12 | px-34722883 | video 'Temple of Heaven Beijing'; photo 'Temple of Heaven Be | pxp-5504695 shows the Hall of Prayer but its slug says Forbidden City, so it cannot be named as either. Alt-only ToH photos (pxp-14075951, pxp-27514715/18/19/22/26, pxp-5846481, pxp-1423579, pxp-5760731) have generic slu |
| VIDEO+PHOTO | Three Pagodas of Chongsheng Temple | 5 | 0 | 0 | 10 | px-40322435 | video "Three Pagodas Dali"; photo "Three Pagodas Chongsheng  | 13 'Dali pagoda' slugs (e.g. px-40322439 'walking-tour-of-historic-dali-pagoda', 40322696, 40322691, 40322434 'pagoda in tranquil park') do not name the site. Dali's Hongsheng Temple 'One Pagoda' (Yita) is a near-identic |
| VIDEO+PHOTO | Xi'an Bell Tower & Drum Tower | 31 | 0 | 0 | 17 | px-39112928 | video+photo 'xian bell tower drum tower' | Beijing Bell/Drum Tower photos are mixed into the results (slugs say Beijing; never caption them as Xi'an): pxp-37506159, pxp-39517215, pxp-25558881, pxp-25558872, pxp-18356516, pxp-29474210. pxp-5305568 (Kowal Tyler) is |
| VIDEO+PHOTO | Xi'an City Wall | 27 | 1 | 0 | 8 | px-35126267 | video+photo 'xian city wall' (more hits came back on the 'xi | Slugs name the city wall but the previews show no wall (Tang-style mall plazas or lantern shopping streets): px-35245884 (pov-library weakPov entry), px-35245887, px-35245882, px-35228626, px-35228649, px-35228632, px-35 |
| VIDEO+PHOTO | Yu Garden (Yuyuan) | 6 | 0 | 0 | 7 | px-39455289 | Yu Garden Shanghai | The zigzag-bridge teahouse in px-36926179 (slug 'yuyuan-garden-market') is in the bazaar outside the garden walls, so say 'Yu Garden bazaar'. City God Temple clips must carry the City God Temple name, not Yu Garden. Hang |
| VIDEO | Chen Clan Ancestral Hall (Chen Clan Academy) | 6 | 1 | 0 | 1 | px-39222236 | video+photo "Chen Clan Ancestral Hall Guangzhou" | pxp-16005136 'foshan-ancestral-temple' is Foshan Zumiao (different site). px-39222237 'intricate-chinese-temple-rooftop-ornamentation' is the same LayG series and likely Chen Clan, but the slug does not name it, so it is |
| VIDEO | Great Wall walk POV | 4 | 3 | 5 | 2 | px-2881976 | great wall walk pov | The stock slugs never name a section. The K-series frames look like Mutianyu, but say only 'Great Wall' over stock, and say 'Mutianyu' only over owner footage. 32904874's uploader name (GIANG VU) is irrelevant; the slug  |
| VIDEO | Hongyadong stilt buildings | 6 | 0 | 0 | 1 | px-36149453 | video "Hongyadong Chongqing" (photo search skipped because o | Hongyadong is a modern (2000s) complex in traditional stilt-house style. Do not call it 'ancient' or give it a historic build date. pov-library Chongqing 'ancient town' clips are Ciqikou-type streets, not Hongyadong (Ciq |
| VIDEO | Nanjing City Wall & Zhonghua Gate | 5 | 0 | 1 | 2 | px-39285962 | Nanjing city wall Zhonghua Gate | MISLABEL RISK: px-39286471 and pxp-35926463 are slugged 'Zhonghua Gate' but show a three-arch gate topped by a long double-eave building with twin pavilions. The Wikimedia Commons reference (Nanjing-Zhonghua-Gate-3071) s |
| VIDEO | Taoist temple (China) | 4 | 0 | 0 | 2 | px-39475710 | taoist temple china | 38675518 'aerial-view-of-taoist-temple-in-sitiawan' is Malaysia. 33219274 'aerial-view-of-taoist-temple-and-pagoda' has no place (uploader SweeMing YOUNG; likely Malaysia). Tua Pek Kong temples 37929114/37946072 are Mala |
| VIDEO | Temple stairs POV (China) | 3 | 5 | 0 | 0 | px-34722883 | temple stairs china pov | Unplaced step clips are type-level only: 36675730 (in the library, location unknown), 39910434, 34371467 'ascending steps towards giant buddha statue', 39903845 'chinese temple with steps and pagoda'. 30838225 is Angkor  |
| VIDEO | Walking a city wall (China) | 6 | 2 | 0 | 3 | px-35226080 | walking city wall | Slugs say 'walk' or 'exploring' but most clips are static: 39286479 'night-walk-on-the-historic-nanjing-wall' is a static high-angle shot, and 39287874 'night-walk-along-nanjing-city-wall' is static. 35195637 'xian moder |
| VIDEO | Walking a temple (China) | 5 | 5 | 0 | 0 | px-34722881 | walking temple china | Library weak-POV clips px-34722886/34722887 have slugs that name the Temple of Heaven, but the library's placeSpeakable is only 'Beijing'. 39074270 'bustling-activity-at-modern-chinese-temple-in-guangzhou': the slug itse |
| PHOTO | Beihai White Dagoba | 0 | 0 | 0 | 15 | pxp-35691242 | video 'Beihai Park White Dagoba Beijing' (0 named); photo 'B | pxp-28239133 / 28239139 / 28239140 ('a white pagoda on a small island'): the alt names Beihai but the slug does not, so no name. pxp-32752691 'beijing-s-white-pagoda' and pxp-35414181 'white-dagoba-in-beijing' are ambigu |
| PHOTO | Dougong bracket sets (type) | 1 | 0 | 0 | 7 | px-39233203 | dougong bracket | Look-alike detail photos: Vietnam 34271413/38530942/39309353/39521894/36886919/36262560, Ho Chi Minh 32168062, Hue Imperial Palace 33551676, Japan 34575256/34727979/30689148, Bhutan 37747848. Video 39119520/39119521 'asi |
| PHOTO | Drum Tower & Bell Tower | 0 | 0 | 0 | 6 | pxp-39517215 | video 'Beijing Drum Tower Bell Tower'; photo 'Beijing Drum T | MISLABELED: px-36501847 'urban-daylife-near-beijing-bell-tower' actually shows Xi'an's Bell Tower (green glazed roof, red columns, round mall with a Chinese-knot banner). px-36501851 (unnamed) is also Xi'an's Bell Tower  |
| PHOTO | Fenghuang stilt houses | 0 | 0 | 0 | 7 | pxp-34935131 | video+photo "Fenghuang ancient town" | Mislabeled slugs: pxp-25000461 and 25000462 ('illuminated-hong-kong-at-night') and 25000466 have alt text saying Fenghuang, but the slug says Hong Kong or is generic, so exclude them. Alt-only Fenghuang with generic slug |
| PHOTO | Fujian Tulou (Tianluokeng, Chengqi) | 1 | 1 | 0 | 24 | px-32247891 | video+photo "Fujian Tulou" | No slug names Tianluokeng or Chengqi Lou, so say 'Fujian Tulou' only. pxp-34722283 looks like Tianluokeng but cannot be named. Slugs with 'chinese/hakka-tulou' and no 'fujian' may be Guangdong Hakka houses, so say 'tulou |
| PHOTO | Glazed roof tiles (China) | 2 | 0 | 0 | 8 | px-40254275 | glazed roof tiles china | Filter false positive: the regex 'eave' matched 'h-EAVE-n' in 'temple-of-heaven' slugs (for example 40233065, a long hall, not a roof detail). Check roof slugs by eye. 36692616 'traditional-japanese-temple-roof-detail' i |
| PHOTO | Hanging Temple (Xuankong Si) | 0 | 0 | 0 | 4 | pxp-30326823 | video 'Hanging Temple Yungang Grottoes Datong' (combined; bu | px-34307732 (Adam Chen 'majestic-aerial-view-of-chinese-buddhist-temple', aerial, 45 s) visibly shows a cliff-hung temple consistent with the Hanging Temple, but the slug is generic: it CANNOT be named and is aerial anyw |
| PHOTO | Hongcun & Xidi Huizhou villages | 0 | 0 | 0 | 4 | pxp-40267627 | Hongcun village Anhui | Say 'Hongcun' only over the 3 Hongcun-slugged photos; pxp-28968968 gets 'a Huizhou village'. Alt-only Anhui/Huangshan villages (pxp-39725323, pxp-40229914) are not slug-verified. Generic 'traditional Chinese water villag |
| PHOTO | Hutong walk (Beijing) | 0 | 0 | 0 | 13 | pxp-34939602 | hutong walk (+ video 'beijing hutong') | Photo 11111122 'narrow alley in China' is Guizhou, not a hutong. 36917635 'bustling-market-square-in-historic-beijing' is not a hutong. Istanbul, Ho Chi Minh and India alley clips came up in the 'hutong walk' video resul |
| PHOTO | Jokhang Temple | 0 | 0 | 0 | 4 | pxp-40260240 | video+photo 'jokhang temple lhasa' | Video results include Swayambhunath / Kathmandu temples (Nepal). Many 'tibetan temple in Lhasa' photos (Greece-China News, Martin Chan) name Lhasa but not Jokhang, so 'Lhasa' only. |
| PHOTO | Leifeng Pagoda | 2 | 0 | 0 | 23 | px-39955168 | Leifeng Pagoda Hangzhou | px-40020721, px-40033850 and px-40048917 (and probably px-40123017, px-40033560) look exactly like Leifeng, but their slugs say only 'Hangzhou pagoda' or 'West Lake pagoda'. Use 'a pagoda in Hangzhou' or 'by West Lake',  |
| PHOTO | Leshan Giant Buddha | 0 | 0 | 6 | 10 | pxp-38869411 | video+photo "Leshan Giant Buddha" | Mislabeled: pxp-38869381, 38869397 and 38869398 have 'leshan-giant-buddha' slugs but show a small seated Buddha in a lit cave niche (spot-checked). pxp-38869374 and 38869373 look like park and temple carvings (possibly t |
| PHOTO | Lijiang Old Town architecture | 0 | 0 | 0 | 11 | pxp-36847750 | video+photo "Lijiang old town" | Generic 'ancient Chinese town' videos from the Lijiang query are Chongqing/Ciqikou, Zhujiajiao, Taiping and others. Never caption them as Lijiang. |
| PHOTO | Lingyin Temple | 0 | 0 | 0 | 5 | pxp-15816405 | Lingyin Temple Hangzhou | Unnamed 'Hangzhou temple' clips must not be called Lingyin. Frame-checked: px-40033584 shows long steps with escalators, likely the Leifeng scenic area; px-39882938 shows Gushan (孤山) signage. Peter Bibit's 'jiangshan tem |
| PHOTO | Longmen Grottoes | 0 | 0 | 0 | 10 | pxp-34932054 | video+photo 'longmen grottoes luoyang' | The video query returned generic caves ('man praying in cave', 'monk reading in cave', 'cliff dwellings'), which are not Longmen. pxp-34781069 (lit pagoda) and pxp-18851282 (Yingtian Gate) are Luoyang but are different s |
| PHOTO | Monk at temple (China) | 0 | 0 | 0 | 5 | pxp-34885681 | monk temple china | Lhasa/Tibet: architecture or tourism framing only, no political wording. 'Tibetan monk' photos with no place (30599047, 34096350, 28589295) are not China-verified. Video look-alikes: Ta Prohm/Angkor (Cambodia) 19345782/1 |
| PHOTO | Mount Emei temples | 0 | 0 | 1 | 4 | pxp-27594842 | video+photo 'mount emei temple' | The Leshan Giant Buddha (px-39217464 etc. and Leshan photos) names Leshan, a different site; do not call it Emei. 'stunning-aerial-view-of-fansipan-buddhist-landmark' is Vietnam. px-37278297 'remote red temple on cliffs' |
| PHOTO | Potala Palace | 0 | 0 | 0 | 14 | pxp-31013239 | video+photo 'potala palace lhasa' | pxp-5305567 'potala-palace-during-night-time' (Kowal Tyler) is a lit Tang-style hall on a platform, NOT Potala. pxp-34344815 and pxp-34344813 are person-led Hanfu portraits with a Potala-like backdrop, so avoid them. Vid |
| PHOTO | Summer Palace | 0 | 0 | 0 | 14 | pxp-36163424 | video 'Summer Palace Beijing' (0 named; results were FC/ToH) | pxp-16158517 'ruins-old-summer-palace' and pxp-8117824 are Yuanmingyuan (Old Summer Palace), a different site. pxp-20694820's slug says Summer Palace but its alt says Beihai Park (round pavilion + yellow boat), so exclud |
| PHOTO | Suzhou classical gardens (Humble Administrator's, Lingering) | 0 | 0 | 0 | 18 | pxp-15415001 | Humble Administrator's Garden Suzhou; Suzhou garden; Lingeri | pxp-20512972 has slug 'stream-in-a-japanese-park' but alt text 'Suzhou'. That is a conflict, so exclude it. Alt-only items are not slug-verified: Ouyuan Garden pxp-20157433, pxp-36619792, pxp-5578368. Videos slugged 'sha |
| PHOTO | Temple incense (China) | 1 | 0 | 0 | 5 | px-2865339 | temple incense china | The 39579883/39579888 'red incense / red candle' clips are probably Zhujiajiao by their id series, but the slug has no place, so never name it. 37550147 'serene-vietnamese-temple-with-incense' (Vietnam), 29532586 Saigon, |
| PHOTO | White Horse Temple | 0 | 0 | 0 | 4 | pxp-11648438 | video+photo 'white horse temple luoyang' | The video query returned horses ('man with white decorated horse', 'Indian festival horse'). Watch for Thailand's 'White Temple' (Wat Rong Khun) in other queries. 3 of the 4 photos are by Kowal Tyler, whose night Potala/ |
| PHOTO | Yungang Grottoes | 0 | 0 | 0 | 15 | pxp-37340475 | video 'Hanging Temple Yungang Grottoes Datong' (combined); p | Longmen Grottoes (Luoyang, Henan) photos show up in the same results: pxp-38450606/07/09, pxp-11105693, pxp-11105679, pxp-34509120, pxp-34932052/54, pxp-8508726. Also Maijishan (pxp-37579575) and an unnamed 'shanxi grott |
| MAP | Chengyang Wind-and-Rain Bridge & Dong drum towers | 0 | 0 | 0 | 2 | pxp-8776825 | video+photo "Chengyang Wind and Rain Bridge" | px-36501849 is the Xi'an Drum Tower (a city bell/drum tower, not Dong). pov-library px-39975778 (Guangxi nature walkway) is not Chengyang. |
| MAP | Dazu Rock Carvings | 0 | 0 | 0 | 0 |  | video "Dazu Rock Carvings"; photo "Dazu Rock Carvings Chongq | px-36515661 'exploring-ancient-chinese-carvings-by-the-river' (frame-checked) is a modern relief wall. px-39761553 is an unnamed Chongqing dragon relief. pxp-37954767 is in Ziyang, not Dazu. |
| MAP | Great Wall at Badaling | 0 | 0 | 0 | 0 | px-39312225 | video 'Badaling Great Wall'; photo 'Mutianyu Badaling Great  | pxp-13560540 is Juyong Pass (alt-only; a different pass near Badaling). Every Great Wall clip in the results is unnamed or by section-less slug. |
| MAP | Great Wall at Jiankou | 0 | 0 | 0 | 0 | px-39312225 | video 'Jiankou Great Wall'; photo 'Jinshanling Simatai Jiank | Unnamed 'wild' wall shots (px-32904874 misty hike, Eclipse Chasers aerials) must not be called Jiankou. |
| MAP | Great Wall at Jinshanling | 0 | 0 | 0 | 0 | px-39312225 | video 'Jinshanling Great Wall'; photo 'Jinshanling Simatai J | Eclipse Chasers aerials (px-29540574, px-30806149, ...) are unnamed; do not caption them Jinshanling. |
| MAP | Great Wall at Mutianyu | 0 | 0 | 0 | 0 | owner:2026-08-18/ep1-mutianyu.mp4@9.03-13.00 | video 'Mutianyu Great Wall'; photo 'Mutianyu Badaling Great  | pxp-1653823 and pxp-1653825 (Tom Fisk drone): the alt says Huairou, Beijing but the slug is generic, so no section name. The K clips px-2881964..2882797 look like Mutianyu-style towers but are unnamed. Never say 'Mutiany |
| MAP | Great Wall at Simatai | 0 | 0 | 0 | 0 | px-39312225 | photo 'Jinshanling Simatai Jiankou Great Wall' (no dedicated | Same as the other sections: unnamed Great Wall clips only. |
| MAP | Guangji Bridge | 0 | 0 | 0 | 1 |  | video+photo "Guangji Bridge Chaozhou" | Generic 'ancient Chinese stone bridge' clips (e.g. px-39532076, px-39549884) are other bridges. |
| MAP | Guangxiao Temple | 0 | 0 | 0 | 2 | pxp-14647127 | video "Guangxiao Temple Guangzhou"; photos found via Guangzh | px-36708674 'vibrant-life-at-guangzhou-buddhist-temple' (frame-checked) shows a large yellow-roofed hall that may be Guangxiao, but the slug does not name it, so it is type-level only. The Dafo Temple series is a differe |
| MAP | Guoqing Temple | 0 | 0 | 0 | 0 |  | Guoqing Temple Tiantai | The photo search's top hit is Gyeongbokgung (Seoul, Korea), pxp-11765547, a Korean look-alike. Many 'traditional Chinese temple' photos have no location. Never present any of them as Guoqing. |
| MAP | Hanshan Temple | 0 | 0 | 0 | 1 | pxp-18327119 | Hanshan Temple Suzhou | The regex hit pxp-15928323 'tower-in-zhanshan-temple' is Zhanshan Temple in Qingdao, NOT Hanshan. Unnamed 'Suzhou temple' photos must not be called Hanshan. |
| MAP | Huzhu leaning pagoda | 0 | 0 | 0 | 0 |  | Huzhu Pagoda Shanghai | The regex 'leaning-pagoda' matched the Tiger Hill photo pxp-31021040, which is not Huzhu. pxp-37583001 'ancient-leaning-brick-tower-in-nanjing' is in Nanjing, not Shanghai. Video results are Zhujiajiao water-town pagodas |
| MAP | Jiayuguan Pass | 0 | 0 | 0 | 2 | pxp-35370409 | video+photo 'jiayuguan pass' | px-39534569 and px-39538199 (uploader 岩 孙) are generic 'ancient fortress' and 'ancient city wall' clips, unnamed and not Jiayuguan's look. pxp-39076284 'highway near jiayuguan' has no architecture. pxp-38567993 is a watc |
| MAP | Jiming Temple | 1 | 0 | 0 | 2 | px-37528085 | Jiming Temple Nanjing | Other Nanjing temple and pagoda clips in the results are Niushoushan / Usnisa Palace / Hongjue pagoda (px-39389102, px-34510875) and unnamed 'Chinese temple courtyard' clips (px-34070875 and others). None of them are Jim |
| MAP | Kaifeng Iron Pagoda | 0 | 0 | 0 | 0 |  | video+photo 'kaifeng iron pagoda' | pxp-38492551 'spectacular-night-fireworks-over-kaifeng-pagoda' shows a lit pavilion-style tower, not the slender brown Iron Pagoda. Video results were Dali pagodas, Bai Dinh (Vietnam) and Nanjing. |
| MAP | Kaiyuan Temple twin pagodas | 0 | 0 | 0 | 3 | pxp-26664455 | video+photo "Kaiyuan Temple Quanzhou" | 'Kaiyuan Temple' also exists in Chaozhou and Zhengding (Hebei). pxp-20902609's slug has no city; it is accepted only because the photographer (also shot 26664455 in Quanzhou) and the Song stone-pagoda style match Quanzho |
| MAP | Kumbum (Ta'er) Monastery | 0 | 0 | 0 | 1 |  | video+photo 'kumbum monastery xining'; spare photo 'taer tem | Same Tibetan look-alikes as Labrang (Ladakh, Nepal, Mongolia). pxp-20105941 shows a temple in Baruunburen, Mongolia. pxp-35891476 is in Hohhot (Inner Mongolia), a different place. |
| MAP | Labrang Monastery | 0 | 0 | 0 | 0 |  | video+photo 'labrang monastery xiahe' | Lamayuru / Ladakh (India: px-19079014, px-17912055, px-19079016, px-19079020), Sumela Monastery (Turkey), 'a monastery in India', Rumtek (India), Swayambhunath (Nepal), Mongolian temple. px-38905548 'tibetan-buddhist-mon |
| MAP | Liuhe Pagoda (Six Harmonies) | 0 | 0 | 0 | 0 |  | Liuhe Pagoda Hangzhou; Six Harmonies Pagoda Hangzhou | The generic Hangzhou pagoda clips (px-40020721, px-40033850, px-40048917) are visually Leifeng. Using them in a Liuhe story would put the wrong pagoda on screen, so avoid them entirely. |
| MAP | Longhua Pagoda & Temple | 0 | 0 | 0 | 2 | pxp-19204887 | Longhua Temple Shanghai | Unnamed 'pagoda in Shanghai' photos (pxp-35501454, pxp-36212688, pxp-9421023, pxp-37604903) may well be Longhua but their slugs don't say so: type-level only. |
| MAP | Nanputuo Temple | 0 | 0 | 0 | 1 | pxp-29774327 | video+photo "Nanputuo Temple Xiamen" | Do not caption pxp-20300764 or pxp-36675648 as Nanputuo. |
| MAP | Pingyao Ancient City walls | 0 | 0 | 0 | 1 | pxp-18506159 | video 'Pingyao Ancient City Wall'; photo 'Pingyao Ancient Ci | TRAP: the video query returned Xi'an city-wall clips (px-35195606, px-35195639, px-35226076, px-35195642). pxp-37342000 'illuminated-ancient-chinese-city-wall-at-night' is unnamed. pxp-8960761 is Jingzhou's gate. |
| MAP | Porcelain Tower (Dabao'en) | 0 | 0 | 0 | 0 |  | Porcelain Tower Nanjing | Never caption Niushoushan/Usnisa pagoda clips (px-39389102, px-39407965), the Jiming pagoda or generic 'Nanjing pagoda' photos as the Porcelain Tower. The leaning brick tower in Nanjing (pxp-37583001) is also unnamed and |
| MAP | Putuoshan temples | 0 | 0 | 0 | 1 | pxp-18260083 | Putuoshan temple; Mount Putuo Zhoushan | pxp-29774327 is Nanputuo Temple in Xiamen (Fujian), not Putuoshan, despite the name match. pxp-8903203 has a Forbidden City slug but a 'Zhoushan' alt, so exclude it. pxp-19900074 is the Guanyin at Mount Xiqiao in Foshan, |
| MAP | Shanhaiguan (First Pass Under Heaven / Old Dragon Head) | 0 | 0 | 0 | 1 | pxp-39026491 | video 'Shanhaiguan Great Wall'; photo 'Shanhaiguan Great Wal | pxp-39011498 (same photographer, wall fort with a bridge over water) is unnamed. pxp-8960761 is the Jingzhou ancient-city gate (Hubei). pxp-17049371 is Qinhuangdao's modern skyline. Generic Great Wall clips are not Shanh |
| MAP | Six Banyan Temple Flower Pagoda | 0 | 0 | 0 | 1 | pxp-20994314 | video "Six Banyan Temple Guangzhou"; photo "Six Banyan Templ | Generic 'guangzhou-buddhist-temple' clips (px-36708674, px-39074271/39074275/39074291/39074300/39074308) show other temples, mostly the Dafo Temple series (frame-checked 39074291 shows a 请香处 incense stall). Never call th |
| MAP | Small Wild Goose Pagoda | 0 | 0 | 0 | 0 |  | video 'wild goose pagoda xian'; photo 'wild goose pagoda xia | pxp-12112867 is the ONLY slug 'small-wild-goose-pagoda', but it shows a golden diamond-throne-style pagoda with a finial and a green glazed pavilion. That is not the Xi'an pagoda, whose top is broken. pxp-12112864 is the |
| MAP | Tiger Hill leaning pagoda (Yunyan) | 0 | 0 | 0 | 1 | pxp-31021040 | Tiger Hill pagoda Suzhou | The 'Tiger Hill pagoda' video search returns Vietnamese Bai Dinh pagodas (px-27592736, px-30764895), Dali Three Pagodas, Nanning and Nanjing pagodas. Do not use any of them for Tiger Hill. |
| MAP | Wenshu Monastery | 0 | 0 | 0 | 0 |  | video+photo "Wenshu Monastery Chengdu" | px-39687697 'exploring-chengdu-s-ancient-temple-landmark' (frame-checked): the gate plaque reads 古大圣慈寺, so it is Daci Temple, not Wenshu. pxp-19933657 is Qingyang Palace (Taoist); pxp-5992330 is an unnamed Chengdu temple |
| MAP | Xijiang Qianhu Miao Village | 0 | 0 | 0 | 1 | pxp-38964290 | video+photo "Xijiang Miao village" | 'miao' slugs are mostly costume portraits, several shot in Guilin or Guangxi (39452386, 39452379, 36290034) or with unknown location (19578153, 29535100, 29535101). They are not Xijiang and not architecture. |
| MAP | Xingjiao Temple, Shaxi | 0 | 0 | 0 | 0 |  | video "Shaxi ancient town Yunnan"; photo "Shaxi Yunnan" | px-27958758 'shaxi-ancient-town-taicang-china' (frame-checked) is Shaxi in Taicang, Jiangsu: a Jiangnan canal water town, not Yunnan. About 15 past runs used it as generic water-town imagery, which was fine; never use it |
| MAP | Yingxian Wooden Pagoda (Sakyamuni Pagoda of Fogong Temple) | 0 | 0 | 0 | 1 | pxp-15955261 | video 'Yingxian Wooden Pagoda Shanxi'; photo 'Yingxian Woode | The yao yao series slugs alternate between 'shanxi' and 'shaanxi': WRONG province on 32964713/14/20/32 (it is in Shanxi). pxp-32384105 'historic-pagoda-in-datong' looks like the Yingxian pagoda (geo-mislabel): avoid. Pag |
| MAP | Zhangye Giant Buddha Temple | 0 | 0 | 0 | 1 |  | video+photo 'zhangye giant buddha temple' | px-39074265 and px-39074264 are 'dafo-temple' slugs from Guangzhou Dafo Temple (same Chinese name 大佛寺). px-32874334 (rank 0) is a Fo Guang Shan-style big Buddha with pagodas, a Taiwan look-alike. Other results: 'taiwan-s |
| NONE | Chengde Mountain Resort & Putuo Zongcheng Temple | 0 | 0 | 0 | 1 |  | video 'Chengde Mountain Resort Putuo Zongcheng'; photo 'Chen | TRAP: the 'mountain-resort' video slugs are hotels/villas, not Chengde: px-31711089, px-31709675, px-34755514, px-37009833 (frame-checked: pool villa / forest lodge). Adam Chen's px-34307732 / px-34280693 ('chinese buddh |
| NONE | Famen Temple | 0 | 0 | 0 | 0 |  | video+photo 'famen temple' | Nanjing Usnisa Palace (Niushoushan) is a modern mega-Buddhist complex that looks like Famen's modern dagoba, but it is a different site. pxp-32964713/32964732 'ancient wooden pagoda in Shaanxi' is not Famen. |
| NONE | Kaiping Diaolou | 0 | 0 | 0 | 0 |  | video+photo "Kaiping Diaolou" | No look-alikes found. Do not substitute generic 'historic tower' clips. |
| NONE | Lama Temple (Yonghe Gong) | 0 | 0 | 0 | 1 |  | video 'Lama Temple Yonghe Beijing'; photo 'Lama Temple Yongh | px-33009867 (Maciej Głowiński 'traditional-chinese-temple-with-visitors', same upload batch as his Beijing Zhengyang Gate clips) is a static eye-level temple gate with a generic slug: it cannot be named. Tibetan-style st |
| NONE | Miaoying (White Stupa) Temple / Baitasi | 0 | 0 | 0 | 2 | owner:2026-08-18/ep4-baita.mp4@9.03-13.40 | video 'White Stupa Temple Beijing'; photo 'Miaoying Temple W | The 'White Stupa Temple Beijing' video results are all foreign: Boudhanath/Swayambhunath (Nepal: px-35847880, px-37272190, px-28863618 ...), Shanti Stupa Ladakh (px-6651217, px-6650545), Thailand (px-4979402). pxp-358281 |
| NONE | Shaolin Temple & Pagoda Forest | 0 | 0 | 0 | 0 |  | video+photo 'shaolin temple dengfeng' | px-36205244 (rank 0 for the query) is a Lingnan-style temple with a southern China look, not Shaolin. pxp-6724222 is alt-only (a kung-fu performer on a stage). The results also include Nanjing Usnisa Palace and Dali temp |
| NONE | Shenyang Imperial Palace (Mukden Palace) | 0 | 0 | 0 | 1 | pxp-16730527 | video 'Shenyang Imperial Palace'; photo 'Shenyang Imperial P | Forbidden City footage looks similar: never pass FC off as Shenyang. pxp-36962835 'historic-chinese-temple' is unnamed. |
| NONE | Songyue Pagoda | 0 | 0 | 0 | 0 |  | video+photo 'songyue pagoda dengfeng' | Results are dominated by Dali Three Pagodas (Yunnan) and Nanjing Niushoushan. 'bai-dinh-pagoda-tower-in-vietnam' is a Vietnamese look-alike. |
| NONE | Temple of Confucius (Kong Miao) | 0 | 0 | 0 | 1 |  | video 'Qufu Temple of Confucius'; photo 'Qufu Temple of Conf | BIG TRAP: 12 'Confucius Temple' videos are NANJING's Fuzimiao (px-34198757, px-34198763, px-34198903, px-34198907, px-34198925, px-34209354, px-34318621, px-39233201, px-39237093, px-39240079, px-39240087, px-39254234).  |
| NONE | Wudang Mountains temples | 0 | 0 | 0 | 0 |  | video+photo 'wudang mountains' | Results include Yangmingshan (Taiwan) clouds and Vietnam mountain clouds. |
| NONE | Zhaozhou Bridge (Anji Bridge) | 0 | 0 | 0 | 0 |  | photo 'Zhaozhou Bridge Hebei' (video not queried: 0 photos,  | Other Hebei/Tianjin bridges fill the results: Baoding pavilion bridges (pxp-20102028, pxp-20020120), Tianjin steel bridges (pxp-7402017, pxp-13535422), Nanjing stone bridge (pxp-21412053), Shijiazhuang Lingxiao Pagoda (p |
| NONE | Zhenhai Tower (Yuexiu Park) | 0 | 0 | 0 | 0 |  | video "Zhenhai Tower Guangzhou"; photo "Zhenhai Tower Yuexiu | pxp-16795717 'tower-zhenhai-in-china' (spot-checked) is a newly built 3-storey orange timber tower on a wall, not Guangzhou's 5-storey red-brick Zhenhai Tower. Fuzhou and Ningbo also have towers called 'Zhenhai', and the |

各地点完整 id 列表见 queue 里对应 `arch-*` 的 `clips`；新选题先按本表查通道。**长城：没有任何库存片段点名具体段落（八达岭/慕田峪/金山岭/箭扣/司马台），只能说 "the Great Wall"；只有你的慕田峪素材可以叫 Mutianyu。**

## 3. 长视频（隔周五 15:00Z，6-9 分钟搜索型指南）

### 2026-10-23 — Forbidden City Tickets 2026 | China Travel Expert
- 查询词：`forbidden city tickets`
- 素材审片：AUDIT 10-21, expected PASS with ~21 min: 95 Forbidden City slug-named landscape 4K clips (1,267 s; no aerials in the set). Frame-checked 10-19: POV px-40155665, px-40154354, px-35548691; ground px-40163799, px-40159541, px-40156330, px-34811284, px-40154395, px-40157993, px-40165038, px-40156373; library px-34811267. Give the rest a 3-frame check at the audit. EXCLUDE the Tiananmen-area clips px-34811278, px-34811285, px-34811286, px-40144528, px-40144529, px-40144567, px-40144607 and px-40144609; px-34811439 as an opener; and pxp-5504695 (mislabeled; it shows the Temple of Heaven). Roof details come from the 90 FC slug photos. Fallback topic: the Temple of Heaven (pull L2 forward).
- 大纲：~7:15.
- 0:00-0:30 ANSWER: book on the official real-name system 7 days ahead at 20:00 Beijing time, with your passport; no same-day sales; closed Mondays except holidays. CNY 60 until 31 Oct, CNY 40 from 1 Nov, plus CNY 10 each for the Treasure and Clock galleries (#2, #3).
- 0:30-1:45 Ch1, booking step by step: release time, one admission per ID per day, add-ons bought with the ticket (#2; no 40,000 figure).
- 1:45-2:45 Ch2, what it costs: CNY 60/40 vs Versailles EUR 35/25 = 4.4x/4.7x (#3, price row 01, FX 10-16).
- 2:45-3:45 Ch3, route: one-way south to north since 2 Jul 2011; in at the Meridian Gate, out at the Gate of Divine Prowess or the East Prosperity Gate; taxis cannot stop at the north gate (#6).
- 3:45-5:00 Ch4, Hall of Supreme Harmony: Kangxi rebuild 1695-97, 2,377 m2, 11x5 bays; the only building with 10 roof beasts (#5, #4).
- 5:00-6:00 Ch5, the myth: '9,999.5 rooms' vs 8,886 bays in ~980 buildings (#1).
- 6:00-6:45 Ch6, after the north gate: Jingshan for the roof view (text card, since there is no Jingshan footage; give its price only if verified) (#6).
- 6:45-7:15 Recap and close: 'Treasure Gallery add-on or Jingshan view — which?'

Child Shorts (10-24..10-30): arch-01, arch-03, arch-04, plus F3 arch-06 on Wed 10-28. The title must match a YouTube search suggestion. suggestqueries was proxy-blocked on 10-19, so check it at the audit with WebSearch.

### 2026-11-06 — Temple of Heaven Beijing | China Travel Expert
- 查询词：`temple of heaven beijing`
- 素材审片：AUDIT 11-04, expected PASS with ~15.6 min: 69 Temple of Heaven slug-named landscape 4K clips (937 s; no aerials). Frame-checked: library POV px-34722883, px-34722881, px-34722878; ground px-34722890, px-40181108, px-40256829, px-40232985, px-40279903 and px-40254275 (roof detail). px-40183976 shows scaffolding: skip it or caption it. The owner's ep3-tiantan clip is portrait (it does not count) and falls inside the 8-week window after R-02 (10-29), so do not use it. Fallback: the Xi'an City Wall (pull L3 forward).
- 大纲：~7:00.
- 0:00-0:30 ANSWER: from 1 Nov the park opens at 6:30 and the monuments about 8:00. Buy the combined ticket (CNY 28 Nov-Mar, CNY 34 Apr-Oct), not the CNY 10 park-only ticket. Foreign visitors pre-book a passport-linked QR ticket (#12, #13; the QR point is medium confidence, verify it).
- 0:30-1:45 Ch1, tickets: what the park ticket misses (the Hall of Prayer, the Echo Wall and the Circular Mound Altar) (#13).
- 1:45-2:45 Ch2, the locals' hour, 6:30-8:00: tai chi, sword forms, dancing, singing (describe only what the clips show) (#12).
- 2:45-4:00 Ch3, scale: 273 ha, 92 ancient buildings, ~600 rooms, completed 1420, the world's largest surviving complex for sacrifice to heaven, 3.8x the FC (#10).
- 4:00-5:30 Ch4, the Hall of Prayer: burned 1889, rebuilt 1890; 38 m; 28 pillars for the 4 seasons, the 12 months and the 12 two-hour periods; 'famously described as nail-free' (#11).
- 5:30-6:30 Ch5, price: CNY 28 vs Westminster Abbey GBP 31 = 9.9x (price row 02).
- 6:30-7:00 Recap and close: '6:30 with the locals, or later — which?'

Child Shorts (11-07..11-13): arch-08, arch-09, arch-10 (F2), plus F3 arch-12 on Sun 11-08. KILL CHECK 11-20: if L1 and L2 each have fewer than 100 views at 14 days and Search is not rising, pause the lane.

### 2026-11-20 — Xi'an City Wall | China Travel Expert
- 查询词：`xian city wall`
- 素材审片：AUDIT 11-18, expected PASS with ~7 min: 42 Xi'an City Wall slug-named landscape clips (421 s), after dropping 8 wall-slug clips with no wall in frame (px-35245884, px-35245887, px-35245882, px-35228626, px-35228649, px-35228632, px-35228625, px-35195637). Add library POV px-35126267 (a 42 s windshield drive past a wall gate). Frame-checked: px-39126873, px-35226085, px-38803533, px-35195604, px-35195608, px-38805330. The rest were preview-checked only and need a 3-frame check at the audit. No portrait clips, no aerials. Fallback: the Xi'an Bell & Drum Towers (pull L4 forward).
- 大纲：~6:45.
- 0:00-0:30 ANSWER: a 13.74 km loop on top of a Ming wall; a bike loop takes about 1.5-2.5 h; entry ~CNY 54 and a bike ~CNY 45. These are travel-guide figures: verify both with 2 dated sources at the audit (#45, price row 05).
- 0:30-1:45 Ch1, what it is: built 1370-1378 on Tang foundations; 12 m tall, 12-14 m wide on top and 15-18 m at the base; 98 ramparts, 5,948 crenellations (#45).
- 1:45-3:15 Ch2, bike or walk: time needed, rental stations at several gates (#45, travel guides).
- 3:15-4:15 Ch3, getting there: driving past a wall gate (POV px-35126267); name gates only if verified.
- 4:15-5:15 Ch4, price: CNY 54 vs Edinburgh Castle GBP 26 at the gate (4.3x). Dubrovnik is EUR 40 in summer but EUR 15 in winter, only 2.1x: say so (price rows 05, 11).
- 5:15-6:15 Ch5, look down to the centre: the Bell Tower, moved 1,000 m in 1582 (#51; a teaser for L4).
- 6:15-6:45 Recap and close: 'Bike or walk — which?'

Child Shorts (11-21..11-27): arch-34 (F2), arch-37, plus F3 arch-36 on Sun 11-22.

### 2026-12-04 — Xi'an Bell Tower and Drum Tower | China Travel Expert
- 查询词：`xian bell tower`
- 素材审片：AUDIT 12-02, expected PASS with ~11.5 min:
- Bell/Drum Tower: 34 slug-named landscape clips (532 s). The 2 portrait clips (px-38457345, px-39693071) do not count.
- Big Wild Goose Pagoda: 8 slug clips (159 s). Six statue-only 'goose' slugs are dropped: px-39128122, px-39127111, px-39128124, px-39128125, px-39129012, px-39129480.
- Frame-checked: px-39112928, px-39112930, px-39112927, px-39126862, px-39142342; for Big Wild Goose, px-35228645, px-35228648 (99 s), px-39127208, px-35228627, px-39127113, px-39127112.
- Caption Drum vs Bell by slug. Drum Tower slugs: px-39126862, px-39112839, px-39112845, px-39112841, px-39126870, px-39112930, px-39112928, px-39145048.
- Never use the Beijing tower photos that appear in these results.
Fallback: the Forbidden City + Temple of Heaven guide (pull L5 forward).
- 大纲：~6:30, but FACT-THIN: the 10-19 research covers only the Bell Tower (#51) and the Small Wild Goose Pagoda (#33). Research Bell/Drum Tower tickets and hours, Drum Tower facts and Big Wild Goose dates, with 2 sources each, by the 12-02 audit; if they cannot be sourced, run the fallback.
- 0:00-0:30 ANSWER: the Bell Tower stands at the centre of the walled city, with the Drum Tower beside it [tickets and hours: research].
- 0:30-2:00 Ch1, the Bell Tower: built 1384 near the Drum Tower, 36 m, moved about 1,000 m east in 1582 (a plaque on the 2nd floor records it). The turtle-monster legend vs a shifted city centre (#51).
- 2:00-3:15 Ch2, the Drum Tower [research].
- 3:15-4:45 Ch3, the Big Wild Goose Pagoda [research: 2 sources].
- 4:45-5:45 Ch4, its smaller sibling: the 1556 quake took the Small Wild Goose Pagoda from 45 m to 43 m (MAP card only; there is no footage) (#33).
- 5:45-6:30 Recap and close: 'Monster or money — which story do you buy?'

Child Shorts (12-05..12-11): arch-45 if still unused, arch-29, plus a Big Wild Goose seed once its facts are sourced.

### 2026-12-18 — Forbidden City and Temple of Heaven in One Day | China Travel Expert
- 查询词：`forbidden city and temple of heaven in one day`
- 素材审片：AUDIT 12-16, expected PASS with ~36 min combined: the L1 Forbidden City pool (95 clips, 1,267 s) plus the L2 Temple of Heaven pool (69 clips, 937 s). Prefer clips not used in L1 or L2. Same exclusions as L1: the Tiananmen-area clips, px-34811439 as an opener, and pxp-5504695. Run this only as the SEQUEL the playbook calls for, i.e. if L1/L2 earned the highest Search share; otherwise use the 12-16 audit's best-stocked topic (e.g. Dali, pulling L6 forward).
- 大纲：~7:00.
- 0:00-0:30 ANSWER: the Temple of Heaven at 6:30 (Nov-Mar), then the Forbidden City (booked 7 days ahead at 20:00), leaving by the north gate for Jingshan. Never on a Monday (the FC is closed). Tickets: CNY 28 + CNY 40 = CNY 68 (#12, #13, #2, #3).
- 0:30-1:30 Ch1, book both: real-name, passport, release times (#2, #12).
- 1:30-3:00 Ch2, the Temple of Heaven morning: the locals' hour, the combined ticket, the Hall of Prayer rebuilt in 1890 (#12, #13, #11).
- 3:00-3:45 Ch3, the transfer [research: transit and time between the two, 2 sources].
- 3:45-5:30 Ch4, the Forbidden City: the one-way route, the Hall of Supreme Harmony (1695) and its 10 roof beasts (#6, #5, #4).
- 5:30-6:15 Ch5, the day's cost vs Europe: CNY 68 vs Versailles EUR 25 plus Westminster GBP 31 (price rows 01, 02).
- 6:15-7:00 Ch6, the Jingshan finale, recap and close: 'Which first: temple or palace?'

### 2027-01-01 — Three Pagodas Dali | China Travel Expert
- 查询词：`three pagodas dali`
- 素材审片：AUDIT 12-30, expected PASS with ~18 min for the place 'Dali': the probes found 94 Dali-slug landscape clips (drop the aerial px-39563058 and the night-market clips).
- The Three Pagodas may be named only over px-40322435 (9 s), px-40322690 (14 s), px-40323876 (24 s) and px-40322765 (16 s): 63 s in total.
- The rest show Dali temple and old-town architecture (e.g. px-40300664, px-40303775, px-40310038, px-40310041, px-40321415, px-40322437), plus library POV px-40310034 and px-40303779 (temple steps; the temple is unnamed).
- The 13 'Dali pagoda' slugs (px-40322439, px-40322434, px-40322691, ...) get 'a pagoda in Dali', because Hongsheng Temple's pagoda looks almost identical.
- Only ~8 of these clips were frame-checked: give the rest a 3-frame check at the audit.
- 大纲：~6:30, FACT-THIN: only #37 (Qianxun) is in the 10-19 research. Research tickets, hours and Chongsheng Temple facts with 2 sources by the 12-30 audit, or run a sequel to the guide with the best Search share instead.
- 0:00-0:30 ANSWER: the Three Pagodas of Chongsheng Temple sit just outside Dali Old Town [tickets and hours: research].
- 0:30-2:00 Ch1, Qianxun: 69.13 m, 16 storeys, square dense-eave brick, built 833-840 under Nanzhao; two 10-storey octagonal companions, 42.19 m, 12th century (#37).
- 2:00-3:00 Ch2, the odd-storey 'rule' and why these break it (#37; 'almost always' is medium confidence).
- 3:00-4:30 Ch3, Dali's old-town temples on foot (POV steps; unnamed temples stay unnamed).
- 4:30-5:30 Ch4, the style's ancestor: Songyue, 523 AD, 12 sides, 15 eaves (MAP card) (#28).
- 5:30-6:30 Practical info [research], recap and close: 'Rule or myth?'

Child Shorts (01-02..01-08): arch-22 if still unused, arch-30.

## 4. 系列（每个系列建独立播放列表，英文在前）

- **Pagoda Types EP1-6 (+2 bonus)**：arch-22 → arch-23 → arch-24 → arch-25 → arch-26 → arch-27 → arch-32 → arch-33。One pagoda STYLE per episode, strongest footage first: EP1 dense-eave (Dali, video), EP2 lama stupa (Beijing's two white stupas, photos), EP3 leaning (Tiger Hill photo), EP4 wooden pavilion (Yingxian photo), EP5 stone (Quanzhou photos), EP6 glazed 'iron' (MAP). EP7 (diamond-throne) and EP8 (flower) run only after their footage-first probe. Each episode ends 'Next pagoda type: <style>. Follow so you don't miss it.' Run one a week, not on consecutive days, so the F4 baseline keeps its variety.
- **Forbidden City Decoded EP1-5**：arch-01 → arch-03 → arch-04 → arch-02 → arch-05。Child Shorts of L1 (10-23). The Forbidden City has the deepest footage (95 clips plus frame-checked POV), so a numbered mini-series can run 10-24..11-05 with the 2-second 'Full guide: tap the related video above' CTA. F3 arch-06 (Wed 10-28) is the price episode. arch-02 is EP4 so that it lands at least 7 days after R-02 (10-29), which uses the same 7-day ticket fact.
- **Ming Walls & Gates EP1-5**：arch-34 → arch-37 → arch-38 → arch-39 → arch-44。Xi'an and Nanjing are the only city walls with slug-verified video. EP1-2 are L3 children (11-21..11-27). EP3-4 are Nanjing (night footage only; space them at least 3 weeks apart). EP5, Zhengyangmen, runs only if every frame passes the Tiananmen check. The price episodes arch-35 (until 10-31) and arch-36 (from 11-01) run alongside as China Price Check.

## 5. 古建门票 China Price Check（F3，周三/周日）

I built 12 heritage China Price Check pairs for F3. Six clear 4x or more in at least one season. Three are middle cases, under 4x even in their better season. Four are honest cases where China is not cheaper or costs about the same. Pairs 1-4 (Temple of Heaven, Lama Temple, Badaling, Forbidden City) are the best supported.

Currency: rates for Mon 2026-10-19 were not published yet, so I used Fri 2026-10-16. USD/CNY 6.722 (PBOC fix: tradingpedia.com/2026/10/16/pboc-nudges-yuan-fix-stronger-as-daily-rate-drops/; Xinhua 10-15 had 6.7253). EUR/USD 1.124 (Twelve Data and exchangerates.org.uk close 1.1239; ECB 1.1253). GBP/USD 1.333 (Investing.com 1.3329; TradingEconomics 1.3311). USD/JPY 158.0. A 1% move in any rate does not change any multiple.

How I checked prices: WebFetch could not resolve any domain, and curl was refused by the proxy for every ticket site and FX API. So no official page was opened directly. Every price comes from search-engine summaries of the official pages, which can be cached or out of date. Before each publish, open the official page and confirm the number. The shared 200-search limit ran out near the end, so a few sources are older or third-party (marked in each item).

Weak spots:
- No official page found for Xi'an City Wall (booking is WeChat-only), the Dubrovnik walls, Shaolin, Mogao or Potala.
- Westminster Abbey: the official page shows both £31 and £32. I used £31.
- Tower of London: sources show £35.80, £37 and £38. I used £37.
- Versailles: one official page ties the €35 high-season price to fountain-show days. The low-season €25 (Nov-Mar) is clean.

Season matters: from Nov 1, Chinese peak prices drop (Forbidden City ¥40, Temple of Heaven ¥28, Badaling ¥35). Dubrovnik's walls drop to €15 (Nov-Feb), so pair 5 falls to 2.1x. Air pair 5 by Wed 10-28, or use pair 11 instead.

F3 conflict: F3's own rule asks for 4x or more. The four honest pairs (7-10) and the three middle cases (6 at 3.0-3.5x, 11 at 3.9x, the Forbidden City-Vatican peak price at 3.1x) break that rule. Running any of them needs the orchestrator's approval, or a separate "China is NOT cheaper" variant.

Suggested order: Wed 10-21 Temple of Heaven vs Westminster. Sun 10-25 Xi'an Wall vs Dubrovnik. Wed 10-28 Badaling vs Tower of London. Sun 11-01 Forbidden City vs Versailles at low-season prices. Then Lama vs Sagrada, Forbidden City vs Vatican, then the honest pairs mixed in.

Footage (from sibling probes, not frame-checked by me):
- Video+photo: Forbidden City, Tem

- **01 Forbidden City vs Palace of Versailles (palace vs palace)** — Versailles: $28. The Forbidden City: $6. Which palace would you pay for? (Nov 1-Mar 31 prices; through Oct 31 say: Versailles $39, Forbidden City $9)  
  CHINA: Forbidden City standard adult ¥60 (Apr 1-Oct 31) = $8.93; ¥40 (Nov 1-Mar 31) = $5.95. Online only, booked from 20:00 seven days ahead, no same-day sales. Treasure Gallery and Clock Gallery cost ¥10 each extra. WEST: Versailles 'Passport' (palace, Trianon and gardens), standard non-EEA adult: €35 high season = $39.34; €25 low season (Nov 1-Mar 31) = $28.10. EEA visitors pay €32/€22 (two-tier pricing since 2026-01-14). MULTIPLE: 4.4x peak, 4.7x off-season. Adding both Forbidden City galleries (¥80 = $11.90) brings peak to 3.3x. CAVEAT: Versailles' official dated-tickets page ties €35 to M
- **02 Temple of Heaven vs Westminster Abbey (imperial altar vs coronation church)** — Westminster Abbey: $41. Beijing's Temple of Heaven: $5. Is the Abbey really 8x better? (from Nov 1: $41 vs $4)  
  CHINA: Temple of Heaven combined ticket (park plus the main halls, i.e. same tier as full entry) ¥34 peak = $5.06; ¥28 off-season = $4.17. Park-only ticket is ¥15/¥10. Booked 1-7 days ahead on WeChat with a passport. Season dates assumed to be Apr 1-Oct 31 like other Beijing parks; confirm. WEST: Westminster Abbey adult £31 = $41.32. The official page shows 'from 1 Oct 2025: £31', and one cached version shows £32 ($42.66, 8.4x). I used the lower £31. MULTIPLE: 8.2x peak, 9.9x off-season. FOOTAGE: video+photo lane (probe-north frame-0 candidate px-34722883). Strongest pair; recommended for Wed 
- **03 Lama Temple (Yonghegong) vs Sagrada Família (working temple vs working basilica)** — Sagrada Família: $29. Beijing's Lama Temple: $3.72. Is one really worth 8 of the other?  
  CHINA: Lama Temple adult ¥25 = $3.72 (half price ¥12). Real-name online booking, daily cap of 40,000. WEST: Sagrada Família basic ticket €26 = $29.22 (includes audio-guide app; €36 with towers). MULTIPLE: 7.9x. CAVEAT: the newest Lama Temple price sources are the temple's 2017 notice and a 2022 Beijing gov notice. The price has been stable, but I found no 2025/2026 confirmation, so check the 'Yonghegong Visitor Service' WeChat before publishing. The official Sagrada page carries an old '2024' menu heading; the €26 price is the same on both official pages. FOOTAGE: none (probe-north found only 
- **04 Great Wall at Badaling vs Tower of London (fortification vs fortress)** — The Tower of London: $49. The Great Wall at Badaling: $6. Which fortress gets your money?  
  CHINA: Badaling adult ¥40 (Apr 1-Oct 31) = $5.95; ¥35 (Nov 1-Mar 31) = $5.21. Real-name booking 7 days ahead. Cable car not included. WEST: Tower of London adult (no donation) £37 = $49.32. Other versions of the HRP page show £35.80 and £38 ($47.72-$50.65); the hook still works at '$48+'. MULTIPLE: 8.3x peak, 9.5x off-season (8.0x even at £35.80). CAVEAT: the second Badaling source is a 2026 third-party guide; the official page is July 2024. Footage must name Badaling. Mutianyu owner footage is excluded for 8 weeks under pov-8week, and the Mutianyu entry price is unconfirmed (¥40 vs ¥45). FOOT
- **05 Xi'an City Wall (+ bike) vs Dubrovnik City Walls (wall walk vs wall walk) - summer only** — Walking Dubrovnik's walls: $45. Walking Xi'an's 13.7 km Ming city wall: $8. Which wall would you walk? (air by Wed 10-28)  
  CHINA: Xi'an City Wall adult ¥54 = $8.03. Experience add-on: single bike ¥45 (tandem ¥90; the rental window is 90 min, 2 h or 3 h depending on the source; ¥100-200 deposit). Wall plus bike ¥99 = $14.73. WEST: Dubrovnik city walls adult €40 (Mar-Oct) = $44.96, but only €15 (Nov-Feb) = $16.86. MULTIPLE: 5.6x wall vs wall in summer; 3.1x with the bike; only 2.1x after Nov 1. So publish by Oct 28, or use pair 11 in winter. CAVEAT: no official page for either side. Xi'an sells only via the WeChat mini-program 西安城墙景区 and the Dubrovnik official shop wasn't indexed, so both prices are from guides and 
- **06 Summer Palace vs Neuschwanstein (royal retreat vs royal retreat) - middle case, about 3x** — Neuschwanstein: $26. Beijing's Summer Palace, all-access ticket: $9. Fairy-tale castle or emperor's garden?  
  CHINA: Summer Palace through ticket (park plus the separately ticketed sites inside; same tier as Neuschwanstein's interior ticket) ¥60 peak (Apr 1-Oct 31) = $8.93; ¥50 off-season = $7.44. Entry-only is ¥30/¥20 ($4.46/$2.98). WEST: Neuschwanstein adult €21 plus €2.50 online booking fee = €23.50 = $26.41 (€21 at the gate is $23.60). MULTIPLE: 3.0x peak, 3.5x off-season, both on through tickets. Entry-only vs Neuschwanstein would be 5.9x, but that is not the same tier, so don't use it. Below F3's 4x rule, so this is a middle case. FOOTAGE: photo lane (probe-north frame-0 candidate pxp-36163424).
- **07 Terracotta Army vs Colosseum - HONEST: about the same price** — Rome's Colosseum: $20. Xi'an's Terracotta Army: $18. Same price - which ancient wonder do you book first?  
  CHINA: Terracotta Army ¥120 flat all year = $17.85 (students ¥60). Covers Pits 1-3 and Lishan Garden plus the shuttle between them; a ¥5 cart and ¥15 Lishan shuttle are extra. Real-name booking. WEST: Colosseum, Roman Forum and Palatine 24h full ticket €18 = $20.23. Some 2026 guides say €16 plus a €2 booking fee, others €18 plus €2 = $22.48. MULTIPLE: China only 1.1-1.3x cheaper, so this is the honest 'not much cheaper' case. FOOTAGE: slug-named videos exist (exploring-xi-an-terracotta-army-museum-entrance-39145143, exploring-the-historic-terracotta-army-entrance-35168390, exploring-xi-an-terr
- **08 Shaolin Temple vs Kinkaku-ji - HONEST: China costs MORE** — Kyoto's Golden Pavilion: $3. China's Shaolin Temple: $12. China is NOT always cheaper - would you still go?  
  CHINA: Shaolin scenic area full-price adult ¥80 = $11.90 (with the return cable car ¥180; with the Kung Fu show ¥238). WEST/ASIA: Kinkaku-ji adult ¥500 JPY = $3.16; it rose from ¥400 on 2023-04-01. MULTIPLE: China is 3.8x MORE expensive. Note: Ginkaku-ji, not Kinkaku-ji, rose to ¥1,000 ($6.33) on 2026-04-01, and Shaolin still costs 1.9x more than that. Don't confuse the two pavilions. CAVEAT: no official Shaolin page found; 2025 news and a ticket-guide site agree on ¥80. If the script calls Shaolin the 'birthplace of Zen/kung fu', that needs its own source. FOOTAGE: none (probe-central-west), 
- **09 Mogao Caves vs Angkor Wat - HONEST: same price** — Angkor Wat for a whole day: $37. Dunhuang's Mogao Caves, 8 caves: $35. Same money - which is the better day?  
  CHINA: Mogao 'A' ticket (2 films, shuttle, 8 caves, guided) ¥238 Apr-Nov = $35.41. Lonely Planet gives ¥258 for the A ticket with an English-language tour = $38.38. The 'B' emergency ticket is ¥100 for 4 caves. Off-season (Dec-Mar) is ¥119-140 depending on the source ($17.70-$20.83). WEST/ASIA: Angkor 1-day pass $37 (3-day $62), sold only by Angkor Enterprise. MULTIPLE: about equal (1.04x either way). Off-season Mogao would be about 2x cheaper, but those prices conflict. CAVEAT: the official Mogao booking site (莫高窟参观预约网) wasn't reached; both Mogao sources are secondary. FOOTAGE: only 1 slug-na
- **10 Potala Palace vs Alhambra (hilltop palace-citadels) - HONEST: China costs MORE in summer** — Spain's Alhambra: $25. Lhasa's Potala Palace in summer: $30. China costs MORE here - still worth it? (Nov-Apr: Potala $15 vs Alhambra $25)  
  CHINA: Potala Route 1 ¥200 (May 1-Oct 31) = $29.75; ¥100 (Nov 1-Apr 30) = $14.88. Route 2 is ¥100/¥50. Past winters ran free-admission promotions (e.g. Oct 15 2024-Mar 15 2025), so the winter price could be ¥0 if one is renewed; recheck. WEST: Alhambra General (Alcazaba, Nasrid Palaces, Generalife) €22.27 = $25.03. MULTIPLE: China 1.2x MORE in peak; Alhambra 1.7x more in the off-season. CAVEAT: no official Potala page; the sources are a tour agency (reviewed July 2026) and China Daily 2019. Present as architecture/tourism only (no political framing), and give no Tibet entry/permit advice (no-v
- **11 Xi'an City Wall vs Edinburgh Castle (city fortress vs castle) - winter stand-in for pair 05, 3.9x** — Edinburgh Castle: $31. Xi'an's Ming-dynasty city wall: $8. Which fortress would you explore?  
  CHINA: Xi'an City Wall ¥54 = $8.03 (same sources as pair 05). WEST: Edinburgh Castle adult (16-64) £23.50 online = $31.33; £26.00 at the gate = $34.66. Audio guide £4 and guided tour £6.50 are extra. MULTIPLE: 3.9x on the online price (the fair comparison, since Xi'an is also booked online); 4.3x on the gate price. Just under F3's 4x line, so this is a middle case. Use it Nov-Feb when Dubrovnik's winter price kills pair 05. CAVEAT: the official Edinburgh page was last updated about 173 days ago (around late April 2026) and doesn't say '2026'. FOOTAGE: video+photo lane (same traps as pair 05).
- **12 Forbidden City (Palace Museum) vs Vatican Museums (palace museums) - repeat of pair 01, Nov-Mar** — The Vatican Museums: $28. Beijing's Palace Museum: $6. Which palace museum would you book? (Nov 1-Mar 31 only)  
  CHINA: Palace Museum ¥40 (Nov 1-Mar 31) = $5.95; ¥60 Apr-Oct = $8.93. Online only. WEST: Vatican Museums full ticket €20 at the door plus €5 online 'Skip the Line' fee = €25 = $28.10 (walk-up €20 = $22.48). The fair comparison is online vs online, because the Forbidden City sells online only. MULTIPLE: 4.7x off-season (3.8x vs the Vatican walk-up price); only 3.1x at Forbidden City peak, so use it from Nov 1 only. Intended as the repeat episode if pair 01 wins (pov-8week rule: any episode at 4x or more over that day's F4 Short gets the same shape for the next 2 episodes). CAVEAT: the Vatican m

每次发布前打开两个官方页面重核价格；季节价（淡旺季）要按发布日期选。中国不更便宜的诚实对照（兵马俑≈罗马斗兽场、少林寺>金阁寺、布达拉宫夏季>阿尔罕布拉）也做，它们是天然的 DEBATE。

## 6. 格式建议（竞品研究，5 次 search.list）

Method and budget. I used exactly 5 YouTube search.list calls, all order=viewCount, published since 2025-01-01, relevanceLanguage=en: three for Shorts (general architecture, craft/mechanism terms, named sites) and two for medium-length videos (architecture explainers, trip planning). Together they returned 170 videos. I also made ~37 one-unit calls: videos.list and channels.list for stats, 14 playlistItems.list calls to read the 50 latest uploads of 14 niche channels, and 2 videos.list calls to recheck our own 56 architecture videos. Total is about 537 units. The playlistItems calls were not in my brief; they cost 1 unit each, I used no extra search.list, and I am noting them here.

What I could not reach:
- Google and YouTube autocomplete (suggestqueries.google.com): blocked by the proxy (403). I did not retry. So the "exact queries travellers type" are only candidate phrases (see INFO-1). They still need checking against search suggestions.
- WebSearch: the shared limit of 200 searches per turn was already used up, so I ran 0 web searches.
- Thumbnails (i.ytimg.com), Wikipedia pageviews and TripAdvisor were blocked. Reddit could not be fetched. Commons search returned 429 twice, but one search worked.
- Because I could not see thumbnails, footage types come from titles, tags, descriptions and channel names, not from looking at the videos.
- The OR-style queries for craft terms and trip planning matched less than intended (11 and 14 results). Treat "few trip-planning guides exist" as a weak signal.

Findings:
(1) The niche's huge Shorts are 3D-animation "How ancient China built or survived X" pieces:
- Zack D. Films, temples surviving earthquakes: 4.97M views.
- 3D_Spectra_YT: its 22 China/ancient Shorts have a median of 75K views, against 21K for its other topics. Its

- **R1 (F4): 'How it survived' Shorts that SHOW the mechanism (diagram cut-in), not B-roll plus a claim** — Evidence:
- Zack D. Films, 'How Ancient Chinese Temples Survive Earthquakes 😮': 4,972,351 views, 40 s, 4.7% likes (3D animation, judged from channel style).
- 3D_Spectra_YT (#3danimation): 22 China/ancient Shorts, median 75,136 views, against 21,017 for its other topics.
- Forbidden City drainage on a 15-subscriber channel (Rabbit Hole China, 'This Palace Has Never Fully Flooded'): 3,854 views.
- The same claim over stock footage: BrainDrone 4,270, Future Tech 1,492, ours 255 / 124 / 82.
Conclus
- **R2 (F4 MAP plus F1): make the Great Wall the lead subject, with 'which section?' CHOICE hooks** — Evidence:
- The Great Wall is the top subject on the niche's strongest Shorts channel: 3D_Spectra 'How China Built a 10,000-Ton Great Wall in a River' 2,289,406; '...One of History's Greatest Defense Systems' 340,895; '...Great Wall Into the Sea' 283,523.
- Trip-planning Shorts: Olove Travel's best of its last 50 is 'Visiting Beijing? Whatever you do, don't hit the Great Wall on Day 1' at 3,145 (channel median 1,030).
- Our own: toboggan exit (owner footage) 1,007; 'The Great Wall Isn't One Wall
- **R3 (F3): 'Heritage Price Check': Chinese palace or temple ticket against a famous Western landmark, on a price card** — Evidence (highest discussion density in the whole sample):
- The China Adventure, 'Closed for 500 years, now YOU can visit for $5 (Forbidden City, Beijing)': 2,214 views, 7.2% likes, 14.45 comments per 1,000.
- Moote, 'Why Does the Forbidden City Have 9,999 Rooms — Versailles Only Has 2,300': 11,025 views on a 1,070-subscriber channel, 3.7% likes, 4.26 comments per 1,000.
- Our ledger: PRICE-SHOCK x2.61 (n=13), working only at ≥4x gaps on things viewers pay for themselves.

How to make it:
- Kee
- **R4 (F1): owner heritage recuts reframed as INSIDER/STAKES tips, not quiet landmark walks** — Evidence from our own 'Beijing, Walked' series:
- The action/tip clip won: toboggan exit EP1 1,007.
- Quiet plain-fact walks flopped: Summer Palace EP2 100, Temple of Heaven EP3 56, White Stupa EP4 226.

Other channels: trip-planning tip Shorts top their channels.
- Next Wonder China, 'Here's a guide to planning your first trip to Beijing! ⚠️': 258,358 views on 1,820 subscribers (142x subs), 58 s.
- Olove Travel's 'don't hit the Great Wall on Day 1': 3,145, its best recent Short.

How to make it
- **R5 (F2): licensed first-person 'walk the axis' POV at the Forbidden City and Temple of Heaven, never drone** — Evidence:
- Walk-throughs draw discussion; drone-only does not. McBrowser, 'What's Inside the Forbidden City? Walking China's 600-Year-Old Palace': 802 views on 401 subscribers, 6.23 comments per 1,000.
- 'Epic Drone Footage of the Forbidden Palace': 1,961 views, 1.0% likes, 0.51 comments per 1,000.
- Matches the owner's complaint (everything is aerial) and the frame-0 rule.

Footage: the brief now allows city POV of heritage sites, so these slug-named clips qualify. All are 3840x2160 landscape,
- **R6 (F4 series): 'Real or Rebuilt?': one site, two years on screen (original against rebuild), DEBATE close** — Evidence (authenticity arguments pull comments):
- The China Adventure, 'The Problem With China's Ancient Towns…': 3,099 views, 7.1% likes, 6.45 comments per 1,000.
- Moote, 'Why BEIJING Lost So Much of Its Old City｜After Qing': 5.18 comments per 1,000.
- timewarp cities, 'What Beijing ACTUALLY Looked Like Before They Tore Down the Walls (AI Reconstruction)': 59,530 views.
- Our DEBATE hooks: x2.24 (n=8).

How to make it ($0, no AI):
- Current slug-named eye-level clip at frame 0.
- Two big date
- **R7 (F2/F4 structure): add a 45-60 s 'mechanism' arm to the W5 length test, and use one fixed title stem per series** — Evidence:
- Architecture explainer Shorts that win run longer than ours (14-30 s).
- 3D_Spectra last 50: 121-200 s Shorts median 283,523 (n=9) vs 61-120 s median 35,235 (n=40).
- Rabbit Hole China: 60-72 s. Zack D. Films: 30-40 s.
- HiddenBlaze's fixed grammar '<claim> 🤯 <Object label>': median 129,660 over its last 50.

Recommendation:
- Keep the plan's 14-20 s F2/F4 test until 11-16 (don't break the paired comparison).
- In W5, add a 45-60 s architecture mechanism arm (R1 format) next to the p
- **R8 (L): move the heritage search guide forward (Forbidden City first) and add one 'Why…' comparison chapter. Long-form is where subscribers come from** — Evidence, subscribers per 1,000 lifetime views (conversion proxy):
- Long-form history/architecture/travel: The China Adventure 13.6, Moote 12.7, Nick in China 10.6, timewarp cities 9.8, Paladin 7.3, SilkRoadDiaries 4.9, ChinaVista 4.7, Ancient City Reconstruction 3.4.
- Shorts animation channels: 3D_Spectra 0.86, The Outliners 0.50, Zack D. Films 0.36, HiddenBlaze 0.24. Ours: 0.70.

Small-channel long-form architecture winners:
- Moote, 'Why Xi'an Never Returned as China's Capital｜After Tang': 
- **INFO-1: traveller search phrases for heritage trips. UNVERIFIED: autocomplete blocked (403), WebSearch budget used up** — Neither suggestqueries.google.com nor WebSearch was available, so these are candidate phrases, not confirmed autocomplete strings.

Check each in the daily run: playbook line 933 allows WebFetch of suggestqueries or WebSearch; in this container WebFetch would go through the same blocked proxy, so use WebSearch. Keep only phrases that appear verbatim.

Candidates:
- 'forbidden city tickets', 'how to book forbidden city tickets', 'forbidden city tickets sold out', 'forbidden city tickets for forei
- **INFO-2: footage types and view levels in the architecture niche (inferred from title, tags and channel text; thumbnails blocked)** — 3D animation explainers (Shorts):
- Zack D. Films: 4.97M (temples), 13.5M (Chinese tomb lock).
- The Outliners: 34.1M (seismograph).
- 3D_Spectra_YT: median 38K, top 8.0M. Like rates 1.3-4.7%; comments 0.1-0.3 per 1,000.

AI-reconstruction long-form (titles say '(AI Reconstruction)' or '4K historical reconstruction'):
- timewarp cities: 59K-149K on Chinese topics.
- Ancient City Reconstruction: Forbidden City 80K-93K.
- Paladin: up to 64K.

Maps / 'spatial history' long-form (Moote): 11K-41K on 

## 7. 现状说明
- 选题核验：55 条里保留 19、更正 35、删除 1（arch-55，与 R-02 重复）。
- 搜索联想（suggestqueries）被代理拦截，长视频标题里的查询词是候选，发布前用 YouTube 搜索框联想核一次。
- 价格来自官方页面的搜索摘要（代理拦截直连），发布当次必须重核。
