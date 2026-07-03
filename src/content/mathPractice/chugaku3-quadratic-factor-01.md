---
title: 中3数学 展開と因数分解 1
school_stage: chugaku
grade: 3
subject: 数学
unit: 展開・因数分解
order: 1
description: 乗法公式、共通因数、二次式の因数分解を、途中式を書いて練習するプリント。
tags:
  - 中3
  - 数学
  - 展開
  - 因数分解
problems:
  - prompt: (x + 3)(x + 5) を展開しましょう。
    answer: x^2 + 8x + 15
    explanation: x^2 + 5x + 3x + 15 = x^2 + 8x + 15。
    difficulty: basic
    type: expansion
    hints:
      - それぞれの項をかけます。
  - prompt: (x - 4)(x + 2) を展開しましょう。
    answer: x^2 - 2x - 8
    explanation: x^2 + 2x - 4x - 8 = x^2 - 2x - 8。
    difficulty: basic
    type: expansion
    hints:
      - 符号に注意します。
  - prompt: (x + 6)^2 を展開しましょう。
    answer: x^2 + 12x + 36
    explanation: (x + a)^2 = x^2 + 2ax + a^2 を使います。
    difficulty: basic
    type: expansion
    hints:
      - 真ん中の項は 2 × x × 6 です。
  - prompt: x^2 + 7x + 12 を因数分解しましょう。
    answer: (x + 3)(x + 4)
    explanation: 積が12、和が7になる数は3と4です。
    difficulty: standard
    type: factorization
    hints:
      - かけて12、たして7です。
  - prompt: x^2 - 5x + 6 を因数分解しましょう。
    answer: (x - 2)(x - 3)
    explanation: 積が6、和が-5になる数は-2と-3です。
    difficulty: standard
    type: factorization
    hints:
      - 2つとも負の数です。
  - prompt: x^2 - 16 を因数分解しましょう。
    answer: (x + 4)(x - 4)
    explanation: x^2 - 4^2 なので、和と差の積にできます。
    difficulty: standard
    type: factorization
    hints:
      - a^2 - b^2 = (a + b)(a - b)。
  - prompt: 3x^2 + 12x を因数分解しましょう。
    answer: 3x(x + 4)
    explanation: 共通因数 3x でくくります。
    difficulty: standard
    type: factorization
    hints:
      - どちらの項にも 3x が入っています。
  - prompt: x^2 - 2x - 15 を因数分解しましょう。
    answer: (x - 5)(x + 3)
    explanation: 積が-15、和が-2になる数は-5と3です。
    difficulty: challenge
    type: factorization
    hints:
      - 片方が正、片方が負です。
  - prompt: 2x^2 + 10x + 12 を因数分解しましょう。
    answer: 2(x + 2)(x + 3)
    explanation: まず2でくくると、2(x^2 + 5x + 6) = 2(x + 2)(x + 3)。
    difficulty: challenge
    type: factorization
    hints:
      - 先に共通因数でくくります。
---
