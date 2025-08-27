/**
 * Lazy‑load images and videos with Instagram/Facebook‑style skeleton shimmer.
 * 
 * 이미지 사용법:
 * <div class="sk-img" style="--ratio:1/1">
 *   <div class="skeleton sk-rect"></div>
 *   <img data-src="large.jpg" alt="...">
 * </div>
 *
 * 영상 사용법:
 * <div class="sk-video" style="--ratio:16/9">
 *   <div class="skeleton sk-rect"></div>
 *   <video data-src="video.mp4" muted loop>
 *     <source data-src="video.mp4" type="video/mp4">
 *   </video>
 * </div>
 *
 * 블러업 효과 (이미지):
 *   <img class="sk-blur" src="tiny-preview.jpg" data-src="large.jpg">
 */
(function(){
  const io = new IntersectionObserver(onIntersect, { rootMargin: "300px" });

  // 이미지 스켈레톤 초기화
  document.querySelectorAll(".sk-img").forEach(holder => {
    const img = holder.querySelector("img");
    if(!img) return;
    holder.classList.remove("sk-loaded");
    
    // 이미 캐시된 이미지가 있으면 스켈레톤 제거
    if(img.complete && img.naturalWidth) {
      // 의도적으로 지연시켜 스켈레톤을 더 오래 보이게 함
      setTimeout(() => {
        holder.classList.add("sk-loaded");
      }, 2000); // 2초 지연
      return;
    }
    
    // data-src가 있으면 지연 로딩
    if(img.dataset.src) {
      io.observe(img);
    } else if (img.getAttribute("src")) {
      // 즉시 로딩하지만 스켈레톤 표시
      if (img.complete && img.naturalWidth) {
        setTimeout(() => {
          holder.classList.add("sk-loaded");
        }, 2000); // 2초 지연
      } else {
        img.addEventListener("load", () => {
          setTimeout(() => {
            holder.classList.add("sk-loaded");
          }, 2000); // 2초 지연
        }, { once: true });
      }
    }
  });

  // 영상 스켈레톤 초기화
  document.querySelectorAll(".sk-video").forEach(holder => {
    const video = holder.querySelector("video");
    if(!video) return;
    holder.classList.remove("sk-loaded");
    
    // data-src가 있으면 지연 로딩
    if(video.dataset.src) {
      io.observe(video);
    } else if (video.getAttribute("src")) {
      // 즉시 로딩하지만 스켈레톤 표시
      video.addEventListener("loadeddata", () => {
        setTimeout(() => {
          holder.classList.add("sk-loaded");
        }, 3000); // 영상은 3초 지연
      }, { once: true });
    }
  });

  function onIntersect(entries){
    for(const e of entries){
      if(!e.isIntersecting) continue;
      
      const element = e.target;
      const holder = element.closest(".sk-img, .sk-video");
      
      if(element.tagName === "IMG") {
        // 이미지 처리
        const src = element.dataset.src;
        if(src){
          // 의도적으로 지연시켜 스켈레톤을 더 오래 보이게 함
          setTimeout(() => {
            element.src = src;
            element.addEventListener("load", () => {
              // 블러 클래스 제거
              element.classList.remove("sk-blur");
              // 추가 지연으로 스켈레톤을 더 오래 보이게 함
              setTimeout(() => {
                holder.classList.add("sk-loaded");
              }, 1500); // 1.5초 추가 지연
            }, { once: true });
          }, 1000); // 1초 지연
        }
      } else if(element.tagName === "VIDEO") {
        // 영상 처리
        const src = element.dataset.src;
        if(src){
          // 의도적으로 지연시켜 스켈레톤을 더 오래 보이게 함
          setTimeout(() => {
            element.src = src;
            // source 태그도 업데이트
            const source = element.querySelector("source");
            if(source && source.dataset.src) {
              source.src = source.dataset.src;
            }
            element.addEventListener("loadeddata", () => {
              // 추가 지연으로 스켈레톤을 더 오래 보이게 함
              setTimeout(() => {
                holder.classList.add("sk-loaded");
              }, 2000); // 2초 추가 지연
            }, { once: true });
          }, 1500); // 1.5초 지연
        }
      }
      
      // 관찰 중단
      io.unobserve(element);
    }
  }

  // 영상 재생/일시정지 토글 함수 (전역으로 노출)
  window.toggleVideoPlay = function(button) {
    const video = button.parentElement.querySelector('video');
    if (!video) return;
    
    if (video.paused) {
      video.play().then(() => {
        button.textContent = '⏸';
      }).catch(err => {
        console.log('영상 재생 실패:', err);
      });
    } else {
      video.pause();
      button.textContent = '▶';
    }
  };

  // 영상 로드 완료 시 썸네일 숨기기
  document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('video[data-src]');
    videos.forEach(video => {
      video.addEventListener('loadeddata', function() {
        const thumbnail = this.parentElement.querySelector('.sk-thumbnail');
        if (thumbnail) {
          thumbnail.style.display = 'none';
        }
      });
    });
  });
})();