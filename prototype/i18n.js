(() => {
  'use strict';
  // Canonical Russian data remains unchanged; only guest presentation is localized.
  const phrases = [
    ['Меню','Menu','菜单'], ['Язык','Language','语言'],
    ['Найти блюдо в разделе','Search this category','搜索本分类菜品'], ['Поиск блюда','Search dishes','搜索菜品'],
    ['Самое популярное','Popular','热门推荐'], ['Рыба','Fish','鱼类'], ['Мясо','Meat','肉类'],
    ['Горячее','Hot dishes','热菜'], ['Напитки','Drinks','饮品'], ['Десерты','Desserts','甜点'], ['Все блюда','All dishes','全部菜品'],
    ['Бургер с говядиной','Beef burger','牛肉汉堡'], ['Пицца Маргарита','Margherita pizza','玛格丽特披萨'],
    ['Лимонад','Lemonade','柠檬水'], ['Капучино','Cappuccino','卡布奇诺'], ['Чизкейк','Cheesecake','芝士蛋糕'], ['Лосось на гриле','Grilled salmon','烤三文鱼'],
    ['Говядина, сыр, томаты и соус в мягкой булочке.','Beef, cheese, tomatoes and sauce in a soft bun.','松软面包配牛肉、芝士、番茄和酱汁。'],
    ['Томаты, моцарелла и свежий базилик.','Tomatoes, mozzarella and fresh basil.','番茄、马苏里拉芝士和新鲜罗勒。'],
    ['Лимон, мята, вода и сахар.','Lemon, mint, water and sugar.','柠檬、薄荷、水和糖。'],
    ['Эспрессо и молоко.','Espresso and milk.','浓缩咖啡和牛奶。'],
    ['Сливочный сыр, песочное печенье, ягодный соус.','Cream cheese, biscuit base and berry sauce.','奶油芝士、饼干底和莓果酱。'],
    ['Филе лосося, овощи на гриле и лимонный соус.','Salmon fillet, grilled vegetables and lemon sauce.','三文鱼柳、烤蔬菜和柠檬酱。'],
    ['Категории меню','Menu categories','菜单分类'], ['Блюда категории','Category dishes','分类菜品'],
    ['Нет в наличии','Unavailable','暂无供应'], ['В этом разделе ничего не найдено','No dishes found in this category','此分类未找到菜品'],
    ['Добавить в корзину','Add to cart','加入购物车'], ['Добавить','Add','添加'], ['Закрыть','Close','关闭'],
    ['Выберите вариант','Choose an option','选择规格'], ['Открыть','View','查看'],
    ['Моя корзина','My cart','我的购物车'], ['Корзина пока пустая.','Your cart is empty.','购物车为空。'],
    ['Стандартная порция','Standard serving','标准份量'], ['Сумма заказа','Order total','订单总额'], ['Отправить заказ','Place order','提交订单'],
    ['Открыть меню','Open menu','打开菜单'], ['Корзина','Cart','购物车'], ['Счет / оплатить','Bill / pay','账单 / 支付'],
    ['Общий счет','Table bill','本桌账单'], ['Осталось оплатить','Remaining','待支付'], ['Оплачено','Paid','已支付'],
    ['Мои позиции','My items','我的菜品'], ['Выбрать все','Select all','全选'], ['Снять выбор','Clear selection','取消选择'],
    ['Выбрано к оплате','Selected total','已选金额'], ['Оплатить выбранное','Pay selected items','支付所选菜品'],
    ['Поделить на всех','Split equally','平分账单'], ['Оплата поровну','Equal payment','平分支付'],
    ['Весь счет','Whole bill','全部账单'], ['На сколько людей делим','Number of people','平分人数'],
    ['В «Поделить на всех»','Split total','平分总额'], ['На человека, примерно','Per person, approximately','每人大约'],
    ['Создать равные доли','Split the bill','确认平分'], ['Назад к счету','Back to bill','返回账单'],
    ['Оплатить эту часть','Pay this part','支付此份'], ['Изменить разделение','Edit split','修改平分'],
    ['Вернуться к общему счету','Back to table bill','返回本桌账单'], ['Счет ещё не разделен.','The bill has not been split yet.','账单尚未平分。'],
    ['Оплата началась: состав и число людей уже не меняются.','Payment has started. The items and people count are fixed.','支付已开始，菜品和人数不可更改。'],
    ['В равном разделении · оплата через «Поровну»','Shared equally · pay under “Equal payment”','已平分 · 请在“平分支付”中支付'],
    ['В счете пока нет позиций.','No items on the bill yet.','账单中暂无菜品。'], ['Счет оплачен.','The bill is paid.','账单已付清。'],
    ['Выбранные позиции','Selected items','所选菜品'],
    ['Как оплатить','Payment method','支付方式'], ['СБП · онлайн','SBP · online','SBP · 在线支付'], ['Карта · онлайн','Card · online','银行卡 · 在线支付'],
    ['Картой через официанта','Card with the waiter','请服务员刷卡'], ['Наличными через официанта','Cash with the waiter','向服务员付现金'],
    ['Добавить чаевые · 10%','Add a tip · 10%','添加小费 · 10%'], ['Необязательно','Optional','可选'],
    ['Ожидаем сотрудника','Waiting for the waiter','等待服务员'], ['Проверяем оплату','Checking payment','正在确认支付'],
    ['Ваша оплата учтена. Остальные могут продолжать заказывать.','Your payment is recorded. Others can keep ordering.','您的付款已记录，其他客人可以继续点餐。'],
    ['Сотрудник принимает оплату. Отменить запрос самостоятельно уже нельзя.','The waiter is taking payment. The request can no longer be cancelled here.','服务员正在收款，此处已无法取消请求。'],
    ['Запрос отправлен. Выбранная доля заблокирована до оплаты или отмены.','Request sent. This part is reserved until payment or cancellation.','请求已发送，此份账单在支付或取消前已锁定。'],
    ['Результат пока не подтвержден. Эта доля защищена от повторной оплаты.','The result is not confirmed yet. This part is protected from duplicate payment.','支付结果尚未确认，此份账单不会重复支付。'],
    ['Чаевые отдельно','Tip separately','小费另计'], ['Онлайн-оплата','Online payment','在线支付'], ['Подтвердить оплату','Confirm payment','确认支付'],
    ['Оплата не прошла','Payment failed','支付失败'], ['Отменить запрос','Cancel request','取消请求'], ['Вернуться к счету','Back to bill','返回账单'],
    ['Визит завершен','Visit ended','本次用餐已结束'], ['Спасибо за визит!','Thank you for visiting!','感谢光临！'], ['Начать новый визит','Start a new visit','开始新的用餐'],
    ['Позвать официанта','Call waiter','呼叫服务员'], ['Официант вызван','Waiter called','已呼叫服务员'],
    ['Официант принял вызов и скоро подойдет.','The waiter accepted your request and will be with you shortly.','服务员已接受呼叫，很快就来。'],
    ['Запрос уже отправлен. Официант скоро подойдет.','Your request has been sent. The waiter will be with you shortly.','请求已发送，服务员很快就来。'],
    ['Отменить вызов','Cancel call','取消呼叫'], ['ОК','OK','确定'],
    ['Добавлено в корзину','Added to cart','已加入购物车'], ['Заказ принят','Order accepted','订单已接收'],
    ['Нет связи. Показаны сохраненные данные.','Offline. Showing saved data.','连接已断开，正在显示已保存的数据。'],
    ['Нельзя изменить разделение после начала оплаты','The split cannot be changed after payment starts','支付开始后无法修改平分'],
    ['Выбранная часть уже недоступна','This part is no longer available','此份账单已不可选'],
    ['Счет изменился. Выберите позиции заново.','The bill has changed. Select your items again.','账单已更新，请重新选择菜品。'],
    ['больше нет в наличии. Уберите позицию из корзины.','is no longer available. Remove it from your cart.','已无供应，请从购物车中移除。'],
    ['Выберите платеж в счете.','Select a payment from the bill.','请在账单中选择付款。'],
    ['Отменено','Cancelled','已取消'], ['Выполнен','Served','已上菜'], ['Принят','Accepted','已接收'], ['В оплате','Payment in progress','支付中'],
    ['К оплате','To pay','待支付'], ['Убрать','Remove','移除'], ['Выбрать','Select','选择'], ['Без категории','Uncategorized','未分类'],
    ['Навигация гостя','Guest navigation','顾客导航'], ['Гость','Guest','客人'], ['Стол','Table','桌号'], ['Человек','Person','份额'],
    ['Поровну:','Equal split:','平分：'], ['человек','people','人'], ['Выбрано','Selected','已选'], ['из','of','/']
  ];
  const sorted = [...phrases].sort((a,b) => b[0].length-a[0].length);
  const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:'+sorted.map(row=>escapeRegex(row[0])).join('|')+')(?![\\p{L}\\p{N}_])','gu');
  const lookup = new Map(phrases.map(row=>[row[0],row]));
  const locales = {ru:'ru-RU',en:'en-US',zh:'zh-CN'};
  function text(value,language) {
    if(language==='ru')return value;
    const index=language==='zh'?2:1;
    return String(value).replace(pattern,match=>lookup.get(match)[index])
      .replace(/(\d+)\s*мл(?=\s|$|[·,])/g, language==='zh'?'$1 毫升':'$1 ml')
      .replace(/(\d+)\s*г(?=\s|$)/g, language==='zh'?'$1 克':'$1 g');
  }
  function apply(root,language) {
    root.lang=locales[language];
    if(language==='ru')return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())) {
      if(!node.parentElement.closest('.language-options'))node.nodeValue=text(node.nodeValue,language);
    }
    for(const element of root.querySelectorAll('[placeholder],[aria-label],img[alt]')) {
      if(element.closest('.language-options'))continue;
      for(const name of ['placeholder','aria-label','alt'])if(element.hasAttribute(name))element.setAttribute(name,text(element.getAttribute(name),language));
    }
  }
  window.SplitBillI18n={text,apply,locales};
})();
