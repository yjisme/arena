function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

/**
 * 创建一个可以滑动的区域
 * @param container 可滑动区域的容器
 * @param duration 自动切换的间隔时间，单位毫秒，如果传入0，表示不进行自动切换
 * @param callback 一个函数，通过该参数，告诉我切换完成之后要做什么
 * @author 袁进
 */
function createSlider(container, duration, callback) {
  var firstItem = container.children[0]; // 获取到第一个子元素
  var width = container.clientWidth; // 得到容器宽度
  var count = container.children.length; // 子元素的数量
  var curIndex = 0; // 用于记录目前界面上，处于第几张的位置

  // 设置容器的高度，等于当前显示的板块的高度
  function setHeight() {
    container.style.height = container.children[curIndex].offsetHeight + 'px';
  }

  setHeight();

  /**
   * 切换到指定的板块
   * @param {*} index 板块的坐标
   */
  function switchTo(index) {
    if (index < 0) {
      index = 0;
    }
    if (index > count - 1) {
      // 大于了最大下标
      index = count - 1;
    }
    // 设置第一个元素的transition
    firstItem.style.transition = '400ms';
    // 设置 第一个 元素的marginLeft
    firstItem.style.marginLeft = -index * width + 'px';
    // 更改目前的位置
    curIndex = index;
    // 调用回调函数
    callback && callback(index);
    setHeight();
  }

  // 处理触摸事件
  container.ontouchstart = function (e) {
    // 手指按下去触发
    var startX = e.touches[0].clientX;
    var startY = e.touches[0].clientY;
    var startLeft = -curIndex * width; // 手指按下去时，元素的marginLeft
    // 关闭transition
    firstItem.style.transition = 'none';
    // 停止自动切换
    stopAuto();
    container.ontouchmove = function (e) {
      var endX = e.touches[0].clientX;
      var endY = e.touches[0].clientY;
      var disX = endX - startX; // x坐标移动的距离
      var disY = endY - startY; // y坐标移动的距离
      var newML = startLeft + disX; // 计算新的margin-left
      // 限制margin-left的范围
      if (newML > 0) {
        newML = 0;
      }
      if (newML < -(count - 1) * width) {
        newML = -(count - 1) * width;
      }
      firstItem.style.marginLeft = newML + 'px';
      if (Math.abs(disX) < Math.abs(disY)) {
        // 用户希望垂直滚动
        return;
      }
      e.preventDefault(); // 去掉浏览器默认行为
    };

    container.ontouchend = function (e) {
      var endX = e.changedTouches[0].clientX;
      var disX = endX - startX; // x坐标移动的距离
      if (Math.abs(disX) < 30) {
        switchTo(curIndex);
      } else if (disX > 0) {
        // 往右边滑动
        switchTo(curIndex - 1);
      } else {
        switchTo(curIndex + 1);
      }

      if (duration) {
        // 有自动切换的功能
        startAuto();
      }
    };
  };

  // 自动切换
  var timerId;
  /**
   * 开始自动切换
   */
  function startAuto() {
    if (timerId) {
      // 目前已经有计时器在自动切换
      return;
    }
    timerId = setInterval(function () {
      /* var newIndex = curIndex + 1;
      if(newIndex > count-1){
        newIndex = count - 1;
      } */
      var newIndex = (curIndex + 1) % count;
      switchTo(newIndex);
    }, duration);
  }

  /**
   * 停止自动切换
   */
  function stopAuto() {
    clearInterval(timerId);
    timerId = null;
  }
  if (duration) {
    // 希望有自动切换
    startAuto();
  }

  return {
    switchTo: switchTo,
  };
}

// banner区域
(function () {
  var container = $('.banner .slider-container');
  var dots = $('.banner .dots');
  createSlider(container, 3000, function (index) {
    // 去除之前的active样式
    var active = $('.banner .dots .active');
    if (active) {
      active.className = '';
    }
    dots.children[index].className = 'active';
  });
})();

// 中部菜单区域

(function () {
  var expand = $('.menu .expand');
  var isExpand = false; // 当前是否是展开的
  var spr = $('.menu .expand .spr');
  var txt = $('.menu .expand .txt');
  var menuList = $('.menu .menu-list');
  expand.onclick = function () {
    if (isExpand) {
      // 折叠
      spr.classList.remove('spr_collapse');
      spr.classList.add('spr_expand');
      txt.innerHTML = '展开';
    } else {
      // 展开
      spr.classList.remove('spr_expand');
      spr.classList.add('spr_collapse');
      txt.innerHTML = '折叠';
    }
    menuList.classList.toggle('list-expand');
    isExpand = !isExpand;
  };
})();

// 通用的block-container逻辑
function createBlockContainer(container) {
  var sliderContainer = container.querySelector('.slider-container');
  var menus = container.querySelector('.block-menu');
  var slider = createSlider(sliderContainer, 0, function (index) {
    // 去除之前的active样式
    var active = menus.querySelector('.active');
    if (active) {
      active.classList.remove('active');
    }
    menus.children[index].classList.add('active');
  });

  for (let i = 0; i < menus.children.length; i++) {
    menus.children[i].onclick = function () {
      slider.switchTo(i);
    };
  }
}

// 新闻区域
(async function () {
  // 先获取数据
  var resp = await fetch('./data/news.json').then(function (resp) {
    return resp.json();
  });
  // 再生成元素
  var result = Object.entries(resp).map(function (item) {
    var type = item[0];
    var news = item[1];
    var html = news.map(function (item) {
      return `<div class="news-item ${type}">
      <a href="${item.link}">${item.title}</a>
      <span>${item.pubDate}</span>
    </div>`;
    });
    return `<div class="slider-item">
      ${html.join('')}
    </div>`;
  });

  $('.news-list .slider-container').innerHTML = result.join('');

  // 最后创建区域
  createBlockContainer($('.news-list'));
})();

// 英雄区域
(async function () {
  // 先获取数据
  var resp = await fetch('./data/hero.json').then(function (resp) {
    return resp.json();
  });
  // 再生成元素
  var sliderContainer = $('.hero-list .slider-container');

  // 根据英雄数组，创建一个英雄的板块
  function createHeroBlock(heroes) {
    var div = document.createElement('div');
    div.className = 'slider-item';
    var html = heroes
      .map(function (item) {
        return `<a>
          <img
            src="https://game.gtimg.cn/images/yxzj/img201606/heroimg/${item.ename}/${item.ename}.jpg"
          />
          <span>${item.cname}</span>
        </a>`;
      })
      .join('');
    div.innerHTML = html;
    sliderContainer.appendChild(div);
  }

  // 搞定热门英雄
  var hots = resp.filter(function (item) {
    return item.hot === 1;
  });
  createHeroBlock(hots);
  // 搞定各种类型的英雄
  for (var i = 1; i <= 6; i++) {
    // 得到类型为i的英雄
    var heroes = resp.filter(function (item) {
      return item.hero_type === i || item.hero_type2 === i;
    });
    createHeroBlock(heroes);
  }

  // 最后创建区域
  createBlockContainer($('.hero-list'));
})();

// 视频
(async function () {
  // 先获取数据
  var resp = await fetch('./data/video.json').then(function (resp) {
    return resp.json();
  });
  // 再生成元素
  var sliderContainer = $('.video-list .slider-container');

  var result = Object.entries(resp).map(function (item) {
    var videos = item[1];
    var html = videos
      .map(function (item) {
        return `<a
          href="${item.link}"
        >
          <img
            src="${item.cover}"
          />
          <div class="title">
            ${item.title}  
          </div>
          <div class="aside">
            <div class="play">
              <span class="spr spr_videonum"></span>
              <span>${item.playNumber}</span>
            </div>
            <div class="time">${item.pubDate}</div>
          </div>
        </a>`;
      })
      .join('');
    return `<div class="slider-item">
    ${html}
    </div>`;
  });
  console.log(result);
  sliderContainer.innerHTML = result.join('');

  // 最后创建区域
  createBlockContainer($('.video-list'));
})();
