class Item {
  constructor(title, href, imgUrl) {
    this.title = title;
    this.href = href;
    this.imgUrl = imgUrl;
  }

  toRow() {
    return [this.title, this.href, this.imgUrl];
  }

  static getRowSize() {
    return new Item().toRow().length;
  }
}

function watchDaily() {
  const response = UrlFetchApp.fetch('https://www.amazon.co.jp/kindle-dbs/browse?widgetId=ebooks-deals-storefront_KindleDailyDealsStrategy&sourceType=recs');
  const responseContentText = response.getContentText();

  const items = getItems(responseContentText);
  if (items.length <= 0) {
    return;
  }

  postItems(items);
}

function watchMonthly() {
  const items = [];
  let page = 1;
  while (true) {
    const response = UrlFetchApp.fetch(`https://www.amazon.co.jp/kindle-dbs/browse/ref=dbs_b_r_brws_zeitgeist_pg?sourceType=zeitgeist&page=${page}`);
    const responseContentText = response.getContentText();

    const loopItems = getItems(responseContentText);
    if (loopItems.length === 0) {
      break;
    }

    items.push(...loopItems);

    page++;

    Utilities.sleep(1000);
  }

  const monthlySheet = getMonthlySheet();

  monthlySheet.getDataRange().clear();

  if (items.length <= 0) {
    return;
  }

  monthlySheet
    .getRange(1, 1, items.length, Item.getRowSize())
    .setValues(items.map(item => item.toRow()));
}

function postMonthlyItems() {
  const monthlySheet = getMonthlySheet();

  const maxPostSize = 30;
  const postSize = Math.min(maxPostSize, monthlySheet.getLastRow());
  if (postSize <= 0) {
    return;
  }

  const items = monthlySheet
    .getRange(1, 1, postSize, Item.getRowSize())
    .getValues()
    .map(row => new Item(...row));
  postItems(items);

  monthlySheet.deleteRows(1, postSize);
}

function getMonthlySheet() {
  const sheetName = 'monthly';

  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadSheet.getSheetByName(sheetName);
  if (sheet) {
    return sheet;
  }

  return spreadSheet.insertSheet(sheetName);
}

function getItems(text) {
  const siteUrl = 'https://www.amazon.co.jp';

  return (text.match(/<a\saria-label=.*?>/g) || [])
    .map(aTag => {
      const [_a, title, href] = aTag.match(/aria-label="(.*?)".*?href="(.*?)"/);
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const imgRegExp = new RegExp(`<img.*?src="(.*?)".*?aria-label=".*?${escapedTitle}.*?".*?>`);
      if (!imgRegExp.test(text)) {
        return null;
      }
      const [_img, imgUrl] = text.match(imgRegExp);

      return new Item(title, `${siteUrl}${href}`, imgUrl);
    })
    .filter(item => item);
}

function postItems(items) {
  if (items.length <= 0) {
    return;
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  const slackIncomingUrl = scriptProperties.getProperty('SLACK_INCOMING_URL');

  const blocks = items.flatMap(item => {
    return {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `<${item.href}|${item.title}>`
      },
      'accessory': {
        'type': 'image',
        'image_url': item.imgUrl,
        'alt_text': item.title
      }
    };
  });

  const options = {
    'method'     : 'post',
    'contentType': 'application/json',
    'payload'    : JSON.stringify({'blocks': blocks})
  };

  UrlFetchApp.fetch(slackIncomingUrl, options);
}
