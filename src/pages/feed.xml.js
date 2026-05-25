import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const COLLECTION_LABEL = {
  kokugo3: '小3 国語',
  kokugo4: '小4 国語',
  kokugo6: '小6 国語',
  chugaku1: '中1 国語',
  chugaku2: '中2 国語',
  chugaku3: '中3 国語',
  kotoko1: '高1 国語',
  kotoko2: '高2 国語',
  kateika5: '小5 家庭科',
  chugakurika1: '中1 理科',
  chugakurika2: '中2 理科',
  chugakurekishi1: '中1 歴史',
  kotokoeigo1: '高1 英語',
  sansu5: '小5 算数',
  chugakukomin3: '中3 公民',
  kotorekishi1: '高1 日本史',
  kotokokanbun1: '高1 漢文',
  kotosekaishi1: '高1 世界史',
};

const COLLECTION_NAMES = Object.keys(COLLECTION_LABEL);

export async function GET(context) {
  // すべての教材を集めて pubDate（lesson.id ベースの安定した一意値）順に並べる。
  // order フィールドが新しい教材ほど大きい数値になっているので、それを timestamp 代わりに使う。
  // 実運用では git の追加日時を使うのが理想だが、ビルド時のメタデータが取得しづらいので
  // ここでは collection 順 × order 順 でソート → ビルド日を pubDate とする。
  const items = [];
  for (const name of COLLECTION_NAMES) {
    const lessons = await getCollection(name);
    for (const lesson of lessons) {
      items.push({
        title: `${lesson.data.title} — ${COLLECTION_LABEL[name]}`,
        description:
          lesson.data.description ??
          `${lesson.data.author}の${lesson.data.title}を、${COLLECTION_LABEL[name]}の教材として再編集。`,
        link: `/library/${name}/${lesson.id}`,
        // 同一教材内でも順序を保てるよう、collection 順 + order を分単位の差として埋め込む
        pubDate: new Date(
          Date.now() -
            (COLLECTION_NAMES.length - COLLECTION_NAMES.indexOf(name)) * 86400000 -
            lesson.data.order * 60000,
        ),
        author: lesson.data.author,
        categories: [
          COLLECTION_LABEL[name],
          lesson.data.subject,
          ...(lesson.data.classical ? ['古典'] : []),
        ],
      });
    }
  }

  return rss({
    title: 'ひらく — 新着教材',
    description:
      '著作権切れの教科書素材を、現行学習指導要領に沿って再編集して公開するオープン教材プロジェクト「ひらく」の新着教材フィード。',
    site: context.site,
    items,
    customData: '<language>ja</language>',
    stylesheet: '/feed.xsl',
  });
}
