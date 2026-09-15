import { CATEGORIES } from "../account/vocabulary";
import { db } from "../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  product,
  productDetails,
} from "../db/schema";

type Details = { locale: string; name: string; descn: string };

type SeedItem = {
  itemid: string;
  listPrice: number;
  unitCost: number;
  details: (Details & {
    image: string;
    attr1?: string | null;
    attr2?: string | null;
  })[];
};

type SeedProduct = {
  productid: string;
  details: Details[];
  items: SeedItem[];
};

type SeedCategory = {
  catid: (typeof CATEGORIES)[number];
  details: Details[];
  products: SeedProduct[];
};

// Demo catalog data — INTERFACES.md § Seed data fixes the minimum content:
// all five CATEGORIES with en_US/ja_JP/zh_CN category details, at least two
// products per category with at least two items each, an African Grey item
// matching "large" and "african", a second parrot item matching "parrot" but
// not "african", and no de_DE row anywhere.
export const CATALOG_SEED: SeedCategory[] = [
  {
    catid: "BIRDS",
    details: [
      { locale: "en_US", name: "Birds", descn: "Birds are great pets, some can even talk!" },
      { locale: "ja_JP", name: "鳥", descn: "鳥は素晴らしいペットです。話せる種類もいます。" },
      { locale: "zh_CN", name: "鸟", descn: "鸟是很棒的宠物，有些甚至会说话。" },
    ],
    products: [
      {
        productid: "BIRDS-PARROTS",
        details: [
          { locale: "en_US", name: "Parrots", descn: "Colorful, talkative parrots." },
          { locale: "ja_JP", name: "オウム", descn: "色鮮やかでおしゃべりなオウムです。" },
        ],
        items: [
          {
            itemid: "BIRDS-PARROTS-1",
            listPrice: 599.99,
            unitCost: 350.0,
            details: [
              {
                locale: "en_US",
                name: "African Grey",
                descn:
                  "A large, intelligent parrot native to Africa, known for exceptional talking ability",
                image: "/images/birds/african-grey.svg",
                attr1: "Grey",
                attr2: "Large",
              },
              {
                locale: "ja_JP",
                name: "ヨウム",
                descn: "アフリカ原産の大型で知能の高いオウムで、優れた話術で知られています。",
                image: "/images/birds/african-grey.svg",
                attr1: "灰色",
                attr2: "大型",
              },
            ],
          },
          {
            itemid: "BIRDS-PARROTS-2",
            listPrice: 349.99,
            unitCost: 200.0,
            details: [
              {
                locale: "en_US",
                name: "Amazon Parrot",
                descn: "A friendly, colorful parrot that loves to mimic sounds",
                image: "/images/birds/amazon-parrot.svg",
                attr1: "Green",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "アマゾンインコ",
                descn: "陽気で色鮮やかなオウムで、物真似が得意です。",
                image: "/images/birds/amazon-parrot.svg",
                attr1: "緑",
                attr2: "中型",
              },
            ],
          },
        ],
      },
      {
        productid: "BIRDS-FINCHES",
        details: [
          {
            locale: "en_US",
            name: "Finches",
            descn: "Small, social songbirds great for beginners.",
          },
          { locale: "ja_JP", name: "フィンチ", descn: "初心者に最適な小さく社交的な鳴き鳥です。" },
        ],
        items: [
          {
            itemid: "BIRDS-FINCHES-1",
            listPrice: 24.99,
            unitCost: 12.0,
            details: [
              {
                locale: "en_US",
                name: "Zebra Finch",
                descn: "A small, social finch known for its striped markings",
                image: "/images/birds/zebra-finch.svg",
                attr1: "Grey",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "キンカチョウ",
                descn: "縞模様が特徴の小さく社交的なフィンチです。",
                image: "/images/birds/zebra-finch.svg",
                attr1: "灰色",
                attr2: "小型",
              },
            ],
          },
          {
            itemid: "BIRDS-FINCHES-2",
            listPrice: 29.99,
            unitCost: 15.0,
            details: [
              {
                locale: "en_US",
                name: "Gouldian Finch",
                descn: "A brightly colored finch native to Australia",
                image: "/images/birds/gouldian-finch.svg",
                attr1: "Multicolor",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "ゴウルドフィンチ",
                descn: "オーストラリア原産の色鮮やかなフィンチです。",
                image: "/images/birds/gouldian-finch.svg",
                attr1: "多色",
                attr2: "小型",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    catid: "CATS",
    details: [
      { locale: "en_US", name: "Cats", descn: "Cats are independent and affectionate companions." },
      { locale: "ja_JP", name: "猫", descn: "猫は自立心があり愛情深い伴侶です。" },
      { locale: "zh_CN", name: "猫", descn: "猫是独立又充满感情的伴侣。" },
    ],
    products: [
      {
        productid: "CATS-SHORTHAIR",
        details: [
          {
            locale: "en_US",
            name: "Shorthair Cats",
            descn: "Low-maintenance cats with short, sleek coats.",
          },
          { locale: "ja_JP", name: "短毛猫", descn: "手入れが簡単な短く艶やかな毛並みの猫です。" },
        ],
        items: [
          {
            itemid: "CATS-SHORTHAIR-1",
            listPrice: 89.99,
            unitCost: 45.0,
            details: [
              {
                locale: "en_US",
                name: "Domestic Shorthair",
                descn: "A friendly, easygoing cat with a short coat",
                image: "/images/cats/domestic-shorthair.svg",
                attr1: "Tabby",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "ドメスティックショートヘア",
                descn: "短毛で人懐っこく穏やかな猫です。",
                image: "/images/cats/domestic-shorthair.svg",
                attr1: "トラ柄",
                attr2: "中型",
              },
            ],
          },
          {
            itemid: "CATS-SHORTHAIR-2",
            listPrice: 129.99,
            unitCost: 70.0,
            details: [
              {
                locale: "en_US",
                name: "Siamese",
                descn: "A vocal, social cat with striking blue eyes",
                image: "/images/cats/siamese.svg",
                attr1: "Cream",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "シャム猫",
                descn: "よく鳴き社交的で、印象的な青い目を持つ猫です。",
                image: "/images/cats/siamese.svg",
                attr1: "クリーム",
                attr2: "中型",
              },
            ],
          },
        ],
      },
      {
        productid: "CATS-LONGHAIR",
        details: [
          {
            locale: "en_US",
            name: "Longhair Cats",
            descn: "Elegant cats with long, luxurious coats.",
          },
          { locale: "ja_JP", name: "長毛猫", descn: "長く豪華な毛並みを持つ優雅な猫です。" },
        ],
        items: [
          {
            itemid: "CATS-LONGHAIR-1",
            listPrice: 199.99,
            unitCost: 110.0,
            details: [
              {
                locale: "en_US",
                name: "Persian",
                descn: "A calm, affectionate cat with a long, thick coat",
                image: "/images/cats/persian.svg",
                attr1: "White",
                attr2: "Large",
              },
              {
                locale: "ja_JP",
                name: "ペルシャ猫",
                descn: "穏やかで愛情深く、長く豊かな毛並みを持つ猫です。",
                image: "/images/cats/persian.svg",
                attr1: "白",
                attr2: "大型",
              },
            ],
          },
          {
            itemid: "CATS-LONGHAIR-2",
            listPrice: 249.99,
            unitCost: 140.0,
            details: [
              {
                locale: "en_US",
                name: "Maine Coon",
                descn: "A large, friendly cat known for its tufted ears",
                image: "/images/cats/maine-coon.svg",
                attr1: "Brown",
                attr2: "Large",
              },
              {
                locale: "ja_JP",
                name: "メインクーン",
                descn: "房毛の耳が特徴の、大きく人懐っこい猫です。",
                image: "/images/cats/maine-coon.svg",
                attr1: "茶色",
                attr2: "大型",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    catid: "DOGS",
    details: [
      { locale: "en_US", name: "Dogs", descn: "Dogs are loyal companions for the whole family." },
      { locale: "ja_JP", name: "犬", descn: "犬は家族全員にとって忠実な伴侶です。" },
      { locale: "zh_CN", name: "狗", descn: "狗是全家人忠诚的伴侣。" },
    ],
    products: [
      {
        productid: "DOGS-BULLDOGS",
        details: [
          {
            locale: "en_US",
            name: "Bulldogs",
            descn: "Sturdy, gentle dogs with a calm temperament.",
          },
          { locale: "ja_JP", name: "ブルドッグ", descn: "頑丈で穏やかな性格の犬です。" },
        ],
        items: [
          {
            itemid: "DOGS-BULLDOGS-1",
            listPrice: 449.99,
            unitCost: 260.0,
            details: [
              {
                locale: "en_US",
                name: "English Bulldog",
                descn: "A gentle, sturdy dog with a wrinkled face",
                image: "/images/dogs/english-bulldog.svg",
                attr1: "Fawn",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "イングリッシュ・ブルドッグ",
                descn: "しわのある顔が特徴の、穏やかで頑丈な犬です。",
                image: "/images/dogs/english-bulldog.svg",
                attr1: "フォーン",
                attr2: "中型",
              },
            ],
          },
          {
            itemid: "DOGS-BULLDOGS-2",
            listPrice: 499.99,
            unitCost: 300.0,
            details: [
              {
                locale: "en_US",
                name: "French Bulldog",
                descn: "A small, playful dog with bat-like ears",
                image: "/images/dogs/french-bulldog.svg",
                attr1: "Brindle",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "フレンチ・ブルドッグ",
                descn: "コウモリのような耳が特徴の、小さく遊び好きな犬です。",
                image: "/images/dogs/french-bulldog.svg",
                attr1: "ブリンドル",
                attr2: "小型",
              },
            ],
          },
        ],
      },
      {
        productid: "DOGS-POODLES",
        details: [
          {
            locale: "en_US",
            name: "Poodles",
            descn: "Intelligent, hypoallergenic dogs in several sizes.",
          },
          {
            locale: "ja_JP",
            name: "プードル",
            descn: "知能が高く、低アレルギー性のさまざまなサイズの犬です。",
          },
        ],
        items: [
          {
            itemid: "DOGS-POODLES-1",
            listPrice: 399.99,
            unitCost: 220.0,
            details: [
              {
                locale: "en_US",
                name: "Standard Poodle",
                descn: "A large, intelligent poodle with a curly coat",
                image: "/images/dogs/standard-poodle.svg",
                attr1: "Black",
                attr2: "Large",
              },
              {
                locale: "ja_JP",
                name: "スタンダード・プードル",
                descn: "巻き毛が特徴の、知能が高く大型のプードルです。",
                image: "/images/dogs/standard-poodle.svg",
                attr1: "黒",
                attr2: "大型",
              },
            ],
          },
          {
            itemid: "DOGS-POODLES-2",
            listPrice: 349.99,
            unitCost: 190.0,
            details: [
              {
                locale: "en_US",
                name: "Toy Poodle",
                descn: "A small, affectionate poodle great for apartments",
                image: "/images/dogs/toy-poodle.svg",
                attr1: "Apricot",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "トイ・プードル",
                descn: "アパート暮らしに適した、小さく愛情深いプードルです。",
                image: "/images/dogs/toy-poodle.svg",
                attr1: "アプリコット",
                attr2: "小型",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    catid: "FISH",
    details: [
      { locale: "en_US", name: "Fish", descn: "Fish bring calm and color to any home." },
      { locale: "ja_JP", name: "魚", descn: "魚はどんな家にも安らぎと彩りをもたらします。" },
      { locale: "zh_CN", name: "鱼", descn: "鱼为家中带来平静与色彩。" },
    ],
    products: [
      {
        productid: "FISH-ANGELFISH",
        details: [
          {
            locale: "en_US",
            name: "Angelfish",
            descn: "Graceful freshwater fish with a distinctive shape.",
          },
          {
            locale: "ja_JP",
            name: "エンゼルフィッシュ",
            descn: "独特の形をした優雅な淡水魚です。",
          },
        ],
        items: [
          {
            itemid: "FISH-ANGELFISH-1",
            listPrice: 14.99,
            unitCost: 6.0,
            details: [
              {
                locale: "en_US",
                name: "Silver Angelfish",
                descn: "A classic silver angelfish with tall fins",
                image: "/images/fish/silver-angelfish.svg",
                attr1: "Silver",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "シルバーエンゼルフィッシュ",
                descn: "背の高いヒレを持つ古典的な銀色のエンゼルフィッシュです。",
                image: "/images/fish/silver-angelfish.svg",
                attr1: "銀色",
                attr2: "小型",
              },
            ],
          },
          {
            itemid: "FISH-ANGELFISH-2",
            listPrice: 16.99,
            unitCost: 7.0,
            details: [
              {
                locale: "en_US",
                name: "Marble Angelfish",
                descn: "A black-and-white marbled angelfish",
                image: "/images/fish/marble-angelfish.svg",
                attr1: "Marble",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "マーブルエンゼルフィッシュ",
                descn: "白黒のマーブル模様のエンゼルフィッシュです。",
                image: "/images/fish/marble-angelfish.svg",
                attr1: "マーブル",
                attr2: "小型",
              },
            ],
          },
        ],
      },
      {
        productid: "FISH-GOLDFISH",
        details: [
          {
            locale: "en_US",
            name: "Goldfish",
            descn: "Hardy, easy-care fish perfect for beginners.",
          },
          { locale: "ja_JP", name: "金魚", descn: "初心者に最適な丈夫で飼いやすい魚です。" },
        ],
        items: [
          {
            itemid: "FISH-GOLDFISH-1",
            listPrice: 4.99,
            unitCost: 1.5,
            details: [
              {
                locale: "en_US",
                name: "Common Goldfish",
                descn: "A hardy, easy-to-care-for goldfish",
                image: "/images/fish/common-goldfish.svg",
                attr1: "Orange",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "和金",
                descn: "丈夫で飼いやすい金魚です。",
                image: "/images/fish/common-goldfish.svg",
                attr1: "オレンジ",
                attr2: "小型",
              },
            ],
          },
          {
            itemid: "FISH-GOLDFISH-2",
            listPrice: 9.99,
            unitCost: 4.0,
            details: [
              {
                locale: "en_US",
                name: "Fantail Goldfish",
                descn: "A goldfish with a distinctive double tail fin",
                image: "/images/fish/fantail-goldfish.svg",
                attr1: "Calico",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "琉金",
                descn: "特徴的な二重の尾ヒレを持つ金魚です。",
                image: "/images/fish/fantail-goldfish.svg",
                attr1: "三毛",
                attr2: "小型",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    catid: "REPTILES",
    details: [
      {
        locale: "en_US",
        name: "Reptiles",
        descn: "Reptiles are fascinating, low-maintenance pets.",
      },
      { locale: "ja_JP", name: "爬虫類", descn: "爬虫類は魅力的で手間のかからないペットです。" },
      { locale: "zh_CN", name: "爬行动物", descn: "爬行动物是迷人且易于饲养的宠物。" },
    ],
    products: [
      {
        productid: "REPTILES-LIZARDS",
        details: [
          {
            locale: "en_US",
            name: "Lizards",
            descn: "Low-maintenance reptiles in a range of sizes.",
          },
          {
            locale: "ja_JP",
            name: "トカゲ",
            descn: "さまざまな大きさの、手間のかからない爬虫類です。",
          },
        ],
        items: [
          {
            itemid: "REPTILES-LIZARDS-1",
            listPrice: 59.99,
            unitCost: 30.0,
            details: [
              {
                locale: "en_US",
                name: "Leopard Gecko",
                descn: "A docile, spotted lizard popular with first-time reptile owners",
                image: "/images/reptiles/leopard-gecko.svg",
                attr1: "Yellow",
                attr2: "Small",
              },
              {
                locale: "ja_JP",
                name: "ヒョウモントカゲモドキ",
                descn: "初めて爬虫類を飼う人に人気の、おとなしく斑点のあるトカゲです。",
                image: "/images/reptiles/leopard-gecko.svg",
                attr1: "黄色",
                attr2: "小型",
              },
            ],
          },
          {
            itemid: "REPTILES-LIZARDS-2",
            listPrice: 89.99,
            unitCost: 45.0,
            details: [
              {
                locale: "en_US",
                name: "Bearded Dragon",
                descn: "A calm, hardy lizard known for its spiky throat",
                image: "/images/reptiles/bearded-dragon.svg",
                attr1: "Tan",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "フトアゴヒゲトカゲ",
                descn: "とげのある喉が特徴の、穏やかで丈夫なトカゲです。",
                image: "/images/reptiles/bearded-dragon.svg",
                attr1: "淡褐色",
                attr2: "中型",
              },
            ],
          },
        ],
      },
      {
        productid: "REPTILES-SNAKES",
        details: [
          {
            locale: "en_US",
            name: "Snakes",
            descn: "Quiet, low-maintenance reptiles for experienced owners.",
          },
          {
            locale: "ja_JP",
            name: "ヘビ",
            descn: "経験者向けの、静かで手間のかからない爬虫類です。",
          },
        ],
        items: [
          {
            itemid: "REPTILES-SNAKES-1",
            listPrice: 79.99,
            unitCost: 40.0,
            details: [
              {
                locale: "en_US",
                name: "Corn Snake",
                descn: "A docile, easy-to-handle snake ideal for beginners",
                image: "/images/reptiles/corn-snake.svg",
                attr1: "Orange",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "コーンスネーク",
                descn: "初心者に理想的な、おとなしく扱いやすいヘビです。",
                image: "/images/reptiles/corn-snake.svg",
                attr1: "オレンジ",
                attr2: "中型",
              },
            ],
          },
          {
            itemid: "REPTILES-SNAKES-2",
            listPrice: 149.99,
            unitCost: 80.0,
            details: [
              {
                locale: "en_US",
                name: "Ball Python",
                descn: "A calm, compact snake known for curling into a ball",
                image: "/images/reptiles/ball-python.svg",
                attr1: "Brown",
                attr2: "Medium",
              },
              {
                locale: "ja_JP",
                name: "ボールパイソン",
                descn: "丸くなる習性で知られる、穏やかでコンパクトなヘビです。",
                image: "/images/reptiles/ball-python.svg",
                attr1: "茶色",
                attr2: "中型",
              },
            ],
          },
        ],
      },
    ],
  },
];

export function seedCatalog(): void {
  for (const seedCategory of CATALOG_SEED) {
    db.insert(category).values({ catid: seedCategory.catid }).run();
    db.insert(categoryDetails)
      .values(seedCategory.details.map((d) => ({ catid: seedCategory.catid, ...d })))
      .run();

    for (const seedProduct of seedCategory.products) {
      db.insert(product)
        .values({ productid: seedProduct.productid, catid: seedCategory.catid })
        .run();
      db.insert(productDetails)
        .values(seedProduct.details.map((d) => ({ productid: seedProduct.productid, ...d })))
        .run();

      for (const seedItem of seedProduct.items) {
        db.insert(item)
          .values({
            itemid: seedItem.itemid,
            productid: seedProduct.productid,
            listPrice: seedItem.listPrice,
            unitCost: seedItem.unitCost,
          })
          .run();
        db.insert(itemDetails)
          .values(
            seedItem.details.map((d) => ({
              itemid: seedItem.itemid,
              attr1: null,
              attr2: null,
              attr3: null,
              attr4: null,
              attr5: null,
              ...d,
            })),
          )
          .run();
      }
    }
  }
}
