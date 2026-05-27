---
title: 鼠算（ねずみざん）
author: 吉田光由『塵劫記』より
author_dates: "1598–1672"
original_year: 1627
era: 江戸時代前期
source:
  text: "「塵劫記」（じんこうき）"
  base: "吉田光由『塵劫記』寛永4年（1627年）初版。問題文は複数の翻刻本（岩波文庫『塵劫記』ほか）に共通する標準的表記による"
school_stage: shogaku
grade: 5
subject: 算数
domains:
  - "数学的活動"
  - "A 数と計算"
classical: true
curriculum_items:
  - code: "数学的活動 (1)"
    label: "日常の事象を算数の問題として捉え、見通しをもって問題を解決する活動"
  - code: "A(1) 整数の性質"
    label: "数の構成や性質、変化のしかたに着目する"
  - code: "C(1) 比例"
    label: "二つの数量の関係に着目し、変化や対応の特徴を考察する／指数的に変化する現象に出会う"
estimated_minutes: 20
order: 3
description: "正月に鼠の親子14匹。2月にはそれぞれが子を産んで…。「ねずみ算式に増える」という言葉の由来になった、江戸時代の有名な「倍々ゲーム」問題。最後の答えはなんと270億匹超え！"
keywords:
  - 和算
  - 塵劫記
  - 鼠算
  - 指数
  - 倍々
cover_image: /illustrations/sansu5/nezumi-zan/scene1.webp
license_editorial: CC-BY-4.0
license_original: PublicDomain
goals:
  - 「毎月7倍に増える」という変化のしかたを、表をつくって体感する
  - 倍々（指数的）にふえる量が、思った以上に急速に大きくなることを実感する
  - "「ねずみ算式に増える」という日本語の表現の由来を知る"
glossary:
  - term: ねずみ
    meaning: ここでは、家にすむクマネズミやドブネズミのこと。実際のネズミも繁殖力が高く、1組のつがいが年に数十匹の子を産むことがある。
  - term: つがい
    meaning: オスとメス、雌雄1組のこと。
  - term: 倍々（ばいばい）に増える
    meaning: 「2倍 → 4倍 → 8倍 → 16倍 …」のように、同じ倍率を何度もかけて急速に大きくなる増え方。数学では「指数的増加」と呼ぶ。
  - term: 指数（しすう）
    meaning: 同じ数を何回かけ合わせるかを表す数。たとえば 7×7×7×7 を「7の4乗（7⁴）」と書き、4が指数。中学校で習う。
  - term: 7¹¹（しちのじゅういちじょう）
    meaning: 7を11回かけ合わせた数。7 × 7 × 7 × … × 7 = 1,977,326,743（約20億）。
questions:
  - "本文の表を見て、各月のネズミの数が「前の月の何倍」になっているか確かめましょう。"
  - "もし鼠が「毎月10倍にふえる」としたら、12月にはどれくらいになるでしょう。月ごとの数を計算してみましょう（電卓を使ってOK）。"
  - "「倍々に増える」例を、身の回りで一つ探してみましょう。（ヒント：折り紙を半分に折り続ける／お年玉を毎月2倍にして残す／インターネットの拡散）"
  - "実際のネズミは、本当にこんなふうに増え続けるでしょうか。何が「ブレーキ」になるかを想像してみましょう。"
  - "この問題から、「ねずみ算式に」という日本語が生まれました。あなたが知っている「倍々に増えて困ったこと」を一つ挙げてみましょう。"
---

<h3>『塵劫記』の問題</h3>

<blockquote class="song">
<p>正月（しょうがつ）に、鼠（ねずみ）の親子 14ひき あり。<br>
父・母 2ひきと、子 12ひき。<br>
2月、この14ひきが、それぞれ 12ひきずつの子を産む。<br>
3月もまた、すべての鼠が同じように子を産む。<br>
このようにして、12月（しわす）には、ねずみは何ひきになるか。</p>
</blockquote>

<p style="font-size: 0.9em; color: var(--text-soft); text-align: right;">— 吉田光由『塵劫記』より（要約）</p>

<h3>問題のしくみを見やすく整える</h3>

<p>『塵劫記』の元の文は、「親子14ひき」を <strong>7組のつがい（夫婦）</strong> と数えています。つがいが12ひきの子を産むと、子のうち6組がまた新たなつがいになり、翌月にはそれぞれが12ひきずつ産む——という仕組みです。</p>

<p>すこし整理すると、ネズミの数は <strong>毎月7倍ずつふえていく</strong>と考えてよい問題になります（親も生き残り、子も次の月にはつがいを組んで産む）。</p>

<h3>月ごとに増えるネズミの数を表にしてみる</h3>

<table style="margin: 1rem auto; border-collapse: collapse; font-size: 0.95em;">
  <tr style="background: var(--bg-soft);">
    <th style="padding: 0.5em 1em; border: 1px solid var(--border);">月</th>
    <th style="padding: 0.5em 1em; border: 1px solid var(--border);">ネズミの数</th>
    <th style="padding: 0.5em 1em; border: 1px solid var(--border);">前月の何倍？</th>
  </tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">1月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">14</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">—</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">2月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">98</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">3月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">686</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">4月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">4,802</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">5月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">33,614</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">6月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">235,298</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">7月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">1,647,086</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">8月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">11,529,602</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">9月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">80,707,214</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">10月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">564,950,498</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">11月</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;">3,954,653,486</td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;">×7</td></tr>
  <tr style="background: var(--bg-soft);"><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;"><strong>12月</strong></td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: right;"><strong>27,682,574,402</strong></td><td style="padding: 0.5em 1em; border: 1px solid var(--border); text-align: center;"><strong>×7</strong></td></tr>
</table>

<h3>答え</h3>

<p>12月のネズミの数は、なんと <strong>276億8257万4402匹</strong>！</p>

<p>これは、現在の世界の人口（約80億人）の<strong>3倍以上</strong>。1月の親子14匹が、わずか11か月でこんな数になってしまいます。</p>

<h3>計算の仕組み</h3>

<p>毎月7倍にふえるので、12月の数は</p>

<p style="text-align: center; font-size: 1.1em;">14 × 7 × 7 × 7 × 7 × 7 × 7 × 7 × 7 × 7 × 7 × 7</p>

<p>つまり「14 に 7 を 11回かけた」数になります。中学校以降の数学では、これを</p>

<p style="text-align: center; font-size: 1.1em;">14 × 7¹¹（じゅういちじょう）</p>

<p>と書きます。「<strong>指数</strong>（しすう）」と呼ばれる書き方で、同じ数をくり返しかけ合わせる回数を、小さく上に書くのです。</p>

<h3>「ねずみ算式に増える」という日本語</h3>

<p>『塵劫記』のこの問題が江戸時代の人々に強い印象を残したため、日本語には今でも <strong>「ねずみ算式に増える」</strong> という表現が残っています。意味は「ものすごい勢いで、倍々にふえていく」。</p>

<p>身の回りには、ねずみ算と同じ仕組みで増えるものがたくさんあります：</p>

<ul>
  <li>細菌やウイルスの増え方（条件がそろえば20分で2倍）</li>
  <li>SNSの情報の拡散（10人に伝わる → 100人 → 1,000人 …）</li>
  <li>銀行の複利の利息（毎年同じ利率を元本にかける）</li>
  <li>連鎖反応（核分裂、雪崩、トランプの「都合のいい嘘」）</li>
</ul>

<h3>歴史の窓 — 倍々の不思議は世界共通</h3>

<p>「倍々にふえると、すぐに巨大な数になる」という驚きは、世界中の数学者を魅了してきました。同じころのインドには「<strong>チェス盤と米粒</strong>」という有名な物語があります。チェス盤の最初のマスに米1粒、次のマスに2粒、その次に4粒……と、マスごとに倍々にしていくと、64マス目には1,800京（けい）粒もの米が必要になる、というお話です。</p>

<p>江戸の『塵劫記』のねずみ算も、その同じ「倍々の驚き」を、日本人になじみ深いネズミの繁殖力で語ったものでした。</p>
