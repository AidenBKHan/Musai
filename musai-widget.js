/**
 * Synced copy of web-widget/musai-widget.js for the GitHub Pages demo
 * (docs/ is served as its own web root, so it can't reference ../web-widget).
 * Keep this in sync with the canonical source until a build step exists.
 *
 * Musai safety-check-index embeddable widget.
 *
 * Usage on any external site:
 *   <div class="musai-safety-widget"
 *        data-country="FR"
 *        data-region="파리"
 *        data-layout="card"
 *        data-api-base="https://your-musai-backend.example.com"></div>
 *   <script src="https://your-cdn.example.com/musai-widget.js" async></script>
 *
 * `data-layout` is one of:
 *   - "card" (default) — compact, static, small circular mascot avatar
 *   - "bottomsheet" — full-width, anchored to the bottom of the viewport,
 *     with a dismiss button, matching the mobile mockup
 *   - "wide" — horizontal panel with the large mascot illustration, for a
 *     desktop sidebar placement (matches the desktop mockup)
 *
 * `data-api-base` is optional — without it (or if the request fails/times
 * out) the widget falls back to clearly-labeled demo data instead of
 * breaking the host page.
 *
 * Host pages that need to re-render a widget on demand (e.g. after a user
 * picks a different destination) can call `window.MusaiWidget.renderInto(el, {
 * countryCode, regionName, apiBase, layout })` directly instead of relying
 * on the one-time data-attribute scan.
 */
(function () {
  var STATUS_LABELS = { safe: '안전', caution: '유의 필요', warning: '위험', avoid: '여행 자제 권고' };
  var STATUS_COLORS = { safe: '#2e7d32', caution: '#c9930f', warning: '#d9730d', avoid: '#c62828' };

  // Small circular crop of the proposal's own "무사(MUSA)" mascot artwork.
  var MASCOT_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAqFBMVEVlYWSanqWTblvRlWuqjHLnsJ3y0aZziaP06uJidY8vMkqdZTJiSDSZrcQhHyvUbGhcMB81ZqEzR2ZCPEm2wtKdMTL6x3S7gT7EgzVemsefPkI9lNWHe4MAAADLy88rJygXFRQJCQrq2M3KqJDox7DPuKqymonW09S4pJSpuMoVFyjz5NgiHBnVw7evqqrUtJk4MzJsWE1JODInIR3OmYaImKzqqJNPSExkQ7ykAAAAOHRSTlP//////////////////////////////////////wD//////////////////////////////////9gBaMoAAAweSURBVHjarZpnY+q4EoZHsmzcIIQkZ8u9axlcKe5w/P//2c5ItkNNOLs7HwihvI+mSBrZwF9PmySr5Wo+c0P59LfgqU/1fl0rfXmQkARlHap//htAnLdaXyEgDbK9XTSy00D5bwFxUVVNPY6/Y1mQmKaZ2WzQl139LwCmYcZx3MhRX/ZZZr+g/cxsCGXYUaTCNor+GeB4PCLBAjlZCJvMfHmZzXhgs3VIRq/2wvN+HWAcyYyfXJ5Zu9nPZ7P/vTqbrJ4A6IPnPUQ8AhgK8NO80Jch22d//PHqsNGBMFxQabWcPyLAA3kFMO1UXgLAzjbBO2YCCHBQiAO+0Qjucf40ID5qQMw6XZyHw4HKtAv7YrPZbxK7DNeI06YK1udkTwI2caQAU3xApA3H4uG5ZVnGEfPMeVpYOWBo2iETLQGMZwBBoAE/j1iJNX2P2ZZpkj7JE+jj4yO2KkNQxb6AyHm90ATjtmLhVj/I8MuGwVspiggVUIsC/LFsBDR+C0u0htPTP/HFZRRHlkBxGS4JEH0DCMjiKjKahif7ivNl27TjPFPBCCeTCyqhuvV9zABGDaSIUvHxJUDpY4wqAZw3rRwncdd1h0P4lR3qhteQiuj48QWA1LNgm3Po23GtCZ+09XqNOet5+fLxEIDqWcCgnwLyUOrKzhih7GH5AICDL1lfq4gcvpF8CFHJaR8ASgBK6OHXlO8h7gJKVG9p0o7pXP+y3SF8AlLKK017HZ71PzOqp44q4waA4x+2we5G/6lEf35UyXTXABjrUqXgRv0w2negUPswbdYjgE36VEHn30DRrjt78wZzi+jO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';

  // Larger, less-cropped version of the same mascot art for the "wide" layout.
  var MASCOT_WIDE_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAC6CAMAAAAeXLbiAAABIFBMVEVjYWHipJaXIyfUXF6XXiqfZlbao15fIxoyXpabmZCZrcQzSGFWcZTx6OEnFRwfLU7205p0UCzHiDecnG67gjnGO0JxjWG2w9Pzw3nTvcLFNDpHPEdeh6pvnsa5O0GKe4ejwpLGdyk0TDY7j8/zfoHJyc7T0tUrJygJCQsXFRTJqY7q2MvOuKrRtJXoyK+vmYu4pJONeWzXxLOot8mylXavqKj05NZtWE4VFyhLOTKoiW90FRdqeo5PR0rx1bOWhHLNlk+VpbeMiIqxdzNwiqYkHBhzhJeJmaw4MzJvaGqqKTCJaVGVJCdMWG3QpnLwx4xOaIq0hk4oIR3QiHYzN0uSdVfQmIZ5k7BPCArz6uNqSDR4ZFTruKlVQjq2tLXKmG+FHEoOAAAAYHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9ebwvOAAApeklEQVR42u2ceV/iWLOAD5rFCChor9Oz3PfeS6IhIYsJMWlCIKzpyOaAtiDw/b/FrToBxbWx35nfO3/cmh5EUHio7VTVOZEU/uFC/h/w/wF/UlK3hdtU6vY29fmfCZjaTaV2qaQQ8/M/DPAzhXv//j38v8K8/ScBZoHvl91vOzvfvu0A4Ptf/g3CvwMQjfv+l1+QD0C/ffsl0eHnfwrgLVCBANgv73e/gRJRvr0HZ/yHAIL+vu3Af4B4cYE2fg+q/AaEP2Vm8jco8P37b1R2di6AMNHgL+iPuz+hRfI3KPAXhLu4oJZFQvwGdbrzy0944l8PiAZOBPR3sUPhdhAQHwbC7H8a8H8xfkF1O1938F+iSkr5e2Ll/7iJV3w8//XrV/7rBcABJw8a/H3nJwj/Dh/8F7Pzlef578D3/Suamf8KuvyWWBxS4+1/FrCYG3AM/x31d4GEOxdf4Qa88NsFPLRz8fvbdPiXAxar5UGN2/l+8JUKqHAHbkCFFwAIqoSgflOg/OWA5UGu32gw1AW/f0cbg6UxWsC+379TwJ23qPCv1yBXO2owjAcLMsuiUS++8xDOGM/gmAgIAf0GN/zrAY+OuH/tMCLcVVIpQLz4/h2sjITf0dSgSAiV1H8OUBx8+sQ1GGWdtjFGKCBYnN9JkiMuzKn/EGAxl6tmb7kjxl6XrqhEEAqIpJh00MpbLnp/KaBYuKmqZvZzShgxjCiK9MGrXRYXPcCDrH1BVYmZ/JctdUj+QrqFFhCnS4rVknN6yTuhXaCMipLC1eT799Xix9MFcGfL4utnAItF8emDC4GQudt1pVk2x8WnknR60upGNkX8vPsNszXPX7BqqcTSfL2zZWXzE4DlUqlaLD7CM4jvul0Qaa6aFg+AktQCRmIjYQp0Bovfn9Viark0qclxzUv9LYDF0lIuVaubajwLie/7FE+Suh8/7vsUULpstU5OfEBUdoGQLRVLssd6sgy1IVY3u7vK3wIoL5fLVBVkpUXRdog/dxM86bL98bffhneAl4BIRKgg2Nty9fbKYwFQZenCd7HVivJmQLG0XP75559AWCqVqBJRfXOgo3ySNL7+be88AUwYT0/8QgG8olS6YkH+lBUWM83FdivKmwGLt8gHhCUq4pnfSvhWcuovCovoDlC6vDw9OTGqpWpJWbIJoCp/pZG8c7GFkd8OmEI80OKKUL+UfBf5VohRQRGL2UC6R5ROZhBWpVuLXQMqEM9Yxm6Trt8OKCPg1dWKUC1pd+4HQhRTKdL4IRuE1i38ZKK/BBBtvJMkm9TfBXh1hYS3ijy/x5N8sSDeQl98JZazQNhaWd2VFUVm7wFLLCZFrGWhfE39tYBi9WrFd5Vaog596R7wVBDF7O7u7h+7KbFsn7ZOQejjjmqxd4BXCIgVNyjw2w+z4b8BSAlnUvfelKd2sXgGfP+TYcUb/QT5Ti/pEzOWYZg7Dd5q37H0QkIcLqX+UsDSnYmvUn+mjE0+6TTKFj82hd/+Z08oFv0EMHHFFs8wK0QKeHBACTFdv3+9i/p3AOUUKz2UliKKvwFfRrnRVnynp9QTL3mWXQMqio6AlBAS9us9yr8BWC1rj/jQxqJ4Vq8XCjchALY2EeOAZdiYZZcYMQcrQjp9eP9aYfN2H0TAJeqvrEubBj44OAUbF8XizU1ZvCmAhQHxcsPMcTxFDS5lVdVbyJf4Ifzbff9yPnw7oLoCTIH+kvgFBZ1KLiF8ax5AGWFmU9CMtE59h0grFdJIkabMGlD7vgb8jn0U5sPbbQDFrQCXFDAVUzz4n2imGbM4lV5WcyV4Guepv7MmlBOqz+6ypIWKREL+HnBFmJgZapvtAItbABZTkGeWqZSDjjWH99fL5cES8b4ts7lBv4F0OzsM0B1bLB3+soaqE+kA1OhSH1RlDwCpF35PlpSLl9PhA8CbwuLHgCV5+ecV6576unmV+l+IwGo/ZrEH5q0gnuVdlkBpys+CycyZgsqgq2OrqloKQHmgceItZVlmedAgAh4gILbzv7xEuAko3ij2D6uLIhhx6biOkcVZPssHDnHXwdJCSx5QuY8NqLEdZzZDZbIOac0tWdbYHR7Vt8o10I7igPh5wk3Am5uCvfgx4G3Kc652tcBxN1Y5aU34ooALEkMPLmPZsq7YHQp4ACamZv72O/qC8iPAsmL/kLBclb0I2KhyKN9rVA8F8k6368aGBk0Kf7DyQhzYQBu688LUaxMwWwTA14wMLZptoOK2UNjLjKeSH4Xgsms+OnDAyeGztdcDQFGxNdt+pfENyYrt8oW3h+z8ktz/CMhB1yfUDcEP+WS+uUvHXrevAIrZgmILmrZ4Ac+OXJr6Wq0nWFvKvRJRj3OXX7khTr526I7FUx0+Bgw1zX4WL3Sgsn9k1ZM3ywNLd905f0BjBHuUF4y8CQhp0A4FQXgGUCCu74LuUH6a7gEiVWLXd3lqYVocXnx7ZmLzANAEQJAnNv4cYdt22ULztv4tvDUiNMyXtMzp+vx6Vrwy8ueXASHLQBgYkAUemncRgfYuL+8D99UQoPd/TLgKNSAkYOCvdOqOvfJjFW4CFhf6IoyiyHisZb/7IBO/aLJtY4cSXiZ9/WUXyiAcZydjuYtXAAsFW7eNKHLChwqE3HJ5B9h6lq+FJmu1HvjofTw8r+6EECzTRUDa5O3QbZTPLwLatqYbs2hmPyy7Zu7GmOAxIEW73PyB5yifQ7z7pUvXQbzVsOFxIJMHIz5NCyPDeBgkC39dmNJBy+laBecgJ6fSM/KU8ilga+NTST7/fRXKF08IH5hY0zTBMLyHTmB3H1YD8OrSOcU7P0df796J1L37KAB5uQn5RIH49Oka0qX2TXLNzrdXABUgNGLhBUA0JTUxgJyfw78D6VxyqczneLvZoVxeXt57ZWsFeBfh1GulOx12IV+vZtcIePVyTwJLceQ+Alx0N94UbqRT98vqgcPz7hyFDo+k88dyF0B3gOgYB/AJ6YOXG4B00kARXzUxECpa+Lg18Te85bLV/XLg+wgHMj5155sV4eGqvXtKSUP5FDzj4ECSTrpSi4Zba/2LX3n+bvz/qMF7CCje3ECqfpRm7E3/P4Wk6Pjj8RgBD8+Rci3P4SWy9jy4C+pyT7rd1VKySoYEd7+/JpsAbEp5patTlAVxnEeJWgwvV+bFF4t8P/LHXyjheOz7X75QNKqsAwp4QDmfg0Q+WDpOuv7pZSvxUXjVVoS7PRfJPO5b6tW+2IaOZ2fnSnxMeO/PUviFRD5V2HicsAGR604dx4k9y/Li2PA8z4ineceZQuA8dM0DUKB/KkWnl3efuBXhNgCbbHizu68DFnbpUaurx8WWfe+H4dgAJfqUkbI5MQt9kKrKV7KqqNhwQNsmA+RyaXneJAbMe32ihcGDw3uf6YZish+1OommvAq4OrC2m3qswwLptlavNw4jqkPQnetMLFm9paNgYANKVbXgEVm+8izElK8si1IC5ApQ6hL3PExmm1AfRYvVWwGaoqSUz6+PPlZ8u6zyeMggntEV+ZII3RBUCMpzHU9O2BK5VUGDClUkqDPhSxBBmyxoEhklCf32JJzja4Gp7R8OMx70xYkC37///Rv79BfFxR++dDoDwLAHypvIpUeiqOqtYqpUjzJVZ0KoUURknEqn513fd09Ccto6Re39eNjyADBxhPeQjH5/qS0xOhHwubjnVnpKSG8U1KOqrgGhT7cSLRqICITkPHSkSFhsMQp6BEjxdvHk1UXq2d/OyqwQ+geOWi29KGbJVFR1E/DqKrEzRvdkfnpAvkT8JLsV3iMfRMAdCrgjPPv7ItcIieRUi7gT9jKkqSgbfNTM2hrRm55g+bIsFn4S8P3Oezz2wD4PmBuRc1ItF4vFlwiLRUr4EDAhtCBPwo17cuLzcvknAGmQvP/2Hg8+PA9Yro56Jxry3QNielnTVfGZ4kqFCGZ5hifTe5TQ0ixNm5yefGGsnwP8BQHp6UT22Z++GTTIqVleE2JMGC5UNDN5gw8ITZMCWg7OraXJnQ6hnNNkTzqRpuzPAOLO+O7u7xRw59koueFGvltcAwKS7EoGcVsnkrXBVywiIKwmLahtfYOcuIkKqVzJFnhhfvRTgOLuDsTI7/T45LM2LnKj8Sx7Dyi3fFEgju+2Wlq1hI+W7wGtVhf7ad8WTub3gHAvPhlPR+JPAaa+ff39fXLk9FkVin1D0jcA5342XGRFAoQu8pWTp4pZBIQnszZ2AgvhNL4jxHX6RDKsnzzY856f7vyCmRpUqDz3ISvuigKDxJJuFCebzfpA0dLL+ExCKIIKva6YzYrJFmN0iWD6ClCTTm3xJwF3eYblL6gGv7HP6FDsOWstAeA8ypIwm9Uj7ASU8krodqypBIFg3hCC5cHCPo0xlHVd12RAnJ6EPw24w7L8wVeWHnq40J6+jB+s+DBYXTvra7bTJVCWuDqw3dzc3AEKoSG5l/NWq9vVCu4syYo61aFxEv0EoChWB1ytxjBT/msK2qc/2Ke7P6I9Vu74ikW5mPUBQoL62J3rN1SoChFQc7tJWe9KguKtawdKaEnjtwECW3WQ4rja0VGD4Vmet0UqTy1c8YsrV6N+WM5GLTp3iAzH3AAsAmDKv8SnLo2ou1DkkkJltbq452dbRzGycQkblRhsPH7JRcReVC7f+1q1mLV5h8x9R9GN8h3gitBwHWfuTxXDKaRKWUzea0Z1drJ1lJA+oCVso9Fy2e9r1yyfbr/061+07H0oYF7JRvPYMKBmLiR42VuQJBcqzjSO4wnr2koJF2hlLVB2n1e2BgSyd++42rK/8hKteV0ZvvDrov3FzJZXVlwvHcHM8Cy9mPClUHavikmgaMZkEsepbBbqbRDlHlHqbQ3IgdY2ijdVbv92nam8YOGOvw7UzeolC4rMJgZOLsRRaKCI4K4F04QfuL2l4ClZXhPOx1sHyR0bfsW7lcywF74AWCHZO75bKkBYXnkfRc+mdv+8TfjEVTJa4yEgRTSV0kzaHlDuJ/U59GOU1fLnl9oLJiZ/JIB3fAi4QQhgipysxyKObKkn3PGlcBscCE2zFJyfbQtIdWcZ0HS5LtWgHDmu8QJgT8gmfLd3QgGTHE11q9zSTA0eaBYSBW7g0YMOAFjUzhfbm1hWNdf1HcNwNRP1CfVT/BKgnb2hBkY0erlXosLiulAomHJqtZKApjYAOXrg60+qwrcCqgBo5NSS7nqgwL4cENcpvAZY2nCrhBCqA4qDx0F3b02KJ6dQg9kEcMVHCZFck87eAqj6My1gicQmicaZT18AjIRsYuHUI0BAusVC/ypxNIgHzVPEO8A7vjVguH2QQB+rqgRtzAY6BdQd4irP90x/RBTwng8IIWDw2EuRPi5jklaurlKCllg4AaQn+qDhQUIKONs+zZimqppaoOk66HCGrYTuTPnnw1js9MpPAG8RUCzer9CY/AAiCWIKeLUJeAXPldytyxmimKqpBoZDfIgTjbaLf1Qq7edd5KNvlovPARaLd9Uq1hhmYZVk4IcVaJiWCd9agyXlfOuCkCxMCA8nMgxfr9J+VtF/+605fH4xF3th9hnAQuG+3MffM5MSKdEmzpMSFd75YNHYOg0WiG1Sqaq+UKILuak3r38d1sWX1rqHJlYx71LAlawVWEjqtaS/uwNcJkGy/VJcIHUT+mwQhRi0nVUUvQ0afGH0UfA1jOJ7Pgporu25Alwh0juYcHA6s9If5sGScWK/BbBKAUu6qrA6bbixXGi/kGhCP3uXB3ENwpUfAdcr74oPhd4qFFC+WgtdjU+3V2CB7JtV+nLwwXQ3MDFI2s1fSfulgws9Qlfi1WjjjjAx6cqqCde6QlWSuQKKTvncrZcRCriggLoP65wfmfi+mj939Zdq6rOxUSzdF+9JAWWa9za940oENK1T0fAGf8E/6YhvAbTR9QDOMFXH0XRcjWN2qr30GmLn0KiuZ0P3BZ7ywKh3srBB9A1RgK/yBj7wwTpd11XiqKrhu44qL48Nduq9+CJAGFGzrSWlPJXFAv7Zj+mAT3ffxgeA18ksz3eDUuAaUC0s+0HMGK8c7+mMfW1z+peyUw8g7bU8hAMPVI3T7VP0HaCNgJ7rf/Es11IR0GPZ+LUTcAsiOVoyKVgLHllSUndgj+CSANED92Rsv40PAJs6KtBxZMcNfEPt9/uyFrPMa8fgxEI4PvANbTVu0V8QbUN0zZt1T6RQfCNfgQhNAQANrAU93Z8BILxtHE9f/6Ti2R/+ueQbHihmjfAIaVM8w+menEik8Fa8FSDU1B7tmOYkmU8Y8cthfL8nQXBnBkoMz3tIJ2gC/FujGY4vnZ+cnPuBIr6dr0A8BFxtvqiGgR2ALBssb/wI0FRFRXP8Q7pF6BOsN4wgMNbCRjPH8bsS7rCfd6FQotoTfwawue46k6ZOhkgO2+3K6/ssxeqSUcT+1AgnDm5wo47oVpy0uj3FDdgDuO/60xhYp15B1LxS8c0+OGrSKEngJp48lz1PbcJq/HK6F6vemThYMnFoRFFlxOTdaX4W+f6X7jndzqab/3Rf059P8UArg3NWR7AZdlkVC28zdAJoebLlGNYsDjxnZgVq5bo5bL8MaNr1RanPtHoVUgFApuXmHQ+qcgL2lg6pDn1nFkUzaGVbPJ93pO4X3/ddALTDhaa/aSXh2r9qqhE4sRNrE81xjCC2EPCF8QeUA9mPZx8BkGu0en2GtK0Gw0891tOV8PD8lLok2PcwMgJjOp3i6TbGH/PMbCzl2ZFOSNy33qRBLmwCoO7MINw8zzimA5Dw+jozfH6rSS4A3+C4XhpwlxEXtNv6csRMrSvNksfnNGakw0Ppy+GXIGbjOM/n83lnPPbz8zEqMOyRGWufiW8DFAaBYanyqn7CcNEAkDwTJWJRtc/OzgQusAeDI75S73Q6NresMSwO78c+2PjgYHx4OCZjKUbJ5xmG8dNg33SXGVn6cDisRGF98XHreCY14bqjyhYNk35/lW+0YW/8tO8C64pnKHbnzBwMGm5lfx8Qoe3lmCv4fGR8KPnwbyzhfrwTTyYxXkQy66EQt7Hsh73JcbvSFjoLzdp2t7NmXV8nSRAA6RBZCNvN3tR1Hr9CuSQWPn4UuXB/fzHIVTnG7+zrQr2jDgaDPk4YWbdFeoeXwOhKLXdKL3FhGkyP9BzSS+ePLDXsHXFhBXKYpeiF7QGbid50XRDaTZBfm234wPMnyeUYtZerhXUF+PpsF4rdQaOzbw+qyRgZFJlPH/Jx+hAMm2eSkTLjDMkEKHsON1paZMYQAGxPvK1HH7XadVNHtmYilUqFGKMpcd3P4sPoXXz8iOatn6mDXK7GulJ9X/1k7e8nhAg5GARpibXImKmhcNw74MtUMkEj3yP+qD9aBpkK8jXb7bq9nR8CYKfZvG7++uuvmXaFkMlkxHG1muHO+c1y4SZbhuit9oX9/cJgkBu8Y+ZSZf9sgSFztm8f9zk1NRhwA+NQ4vq9cR7ggK7BxKgv+MjRkKTngLwMM+32SL++bnY6i4+6uQ3gkfAr6o0Yk9Ho3dE77oirNSzb9TfHH9lsuTo4O+sfQ/2dy+X6sHi4ZP9sLfv1ul0XBCEIemNpasCNQyANAlkTdAVf0Cw9aVoDRw0rYe0dLKXXTSu3ULc4VKHWAmIcj0ZHR0c1rvbOMmtHXEP5PPf5QNw4fwv2k8/qdYiO3KDG5OfTafvsHnA/ud3f740Pe83eeDy87nSur+EGnAYAUYlkfMnU+khIZpU2GC1oKNuYWCzIR+gvIxXIjkbgF8sGpADH5zfzjFnNVQf6GaqPazD5qTObdVZ0dvJFt0GPnfR4nGkTChiGHQrYTpQINnbzCWEGnRDIjc6i8MPigYB6ZHC6d3q2sDxqyLCWF+CDicZ8M8+IBZWGAfDhXtl0FhtBPUEzBxb9kmPrYGhHSleOY2mcuRb6jTaosGnVAiCsRGToz40JRk8/bF+3lzLAh2q1XBZ/vBUmgvLo+ihbK5yCGM5dd+PUXhk0mANC7h0znednk0DTwdwqkn3yEFDlJgC4qE1J87g2TVc6Qp+JIBSa8hGDcVKDdOgEVkIoNMNaI2yG/VSpmr3ZZq9OrZm0nLz7NKI2nfPrtU7EwZXZ58D7GqA+ZzbxoAPaX3A65B3bWlBDa/Wz+v4iINf1TgDBAbcGxup1yEZoYg4zYWCtCMOKMcsY0P6opWpum91O8ZnGbS6t80y5WKoWq3LjCL0vD+a1oIFc7C8StI93sVKn8Vyv79ev4bZT72CUoBdW2pnZLAG0Jg2qw3YlAD7wyKVyVwKLW+wX3zudM+eTDlasDnKf+mbRlGOen+adSWDpuqosNtHOIIzr99K5xioCFNjuJBHSrgyHBAF1PSFUdY3rL7kR3FthVUvqs+74MqBP2xKxsPAcZ8QdqUA4geiYYIekKqq9n6SX/XWWSbS3IkRAUB4CVioZkhkSAoCgeiCMqQ5BeyPGU827hTQ1yL4BsFBgCYQxtG5/RD0oT2LuqFQ11SD2wLy6rsh6vU7tS5e//XsTAyWWOJSyg5q8RhPjQgAFzSzQoRpJCJe1dwxrqcX7RFvOlt8AKIbEnS5TVdUZfxkfjs+POa5qmrJh4ZWZuqBr9cT9Pq4MvACTQ5DYgGfb+wDYEdDInes22hgYwcS+b+A+Alr5iINOIZ5Ysplo7aY8qJbV57zwJcAbbeq6ys1NmZvjodlzqf8vFVRoeSoC6pq3OFsoyFiVFwC4yPXts07dHHj79SongIltboSATR2qbvBBY0agQpppckKIhVgeARWEgjRRhYw4UsvbAYpYHCgz14EluFjiksOdTg1UqOoe6ABadKuv7Oc4yNSLwagOgMKnoxAA1RpTr/ePZgCocwzBPKhCHgTAfoP0Zvm5lajQO4ZaO54YVr8/oPN34Kta2vHWgDfZbPbGVIBPVGr55Pwu11AB0LLoGwQNbd8agQYX3jEGiW0F9f3OvjBp79eDuA1pUJjE0HpdN40GFFyVIYN5kJlTJ8RI8SZxPAn61f6I/kkJWANsQ4m3BCyIWbpBjbuEZopl6BneE4ZZmtAbBPTVHaNOw2FT6jpEBFRGULkFAiYZXIchPoYZzDEkDZ1Jd4ZDksTMnmdZHNSVfajTSiXoZA1x9sxJnWcBKV+5WFBKpqLlGZ5241NmhBoMPM0y4tC26XxycTcLhNKfG2YyeyhDblTBNBO2oa4KscwkURQ5kUMg01g6Pf4o4zi4nxux/eVyaWlCvT4pVp45tEeeVyDd+jWvZEX2+BWgyzQU8EHD8LzYw4llajWDXo0s9aoKgCh7w0GDpVMkKBFX8xqWZbHLc5xAW5+sAEhu0BgZESEhOG3dKHXip7n6ecAyPbUhQy+vBTyTx7HLySXDyKoWGBPo8gm8taYhVjJ3o4MsBERzggZTDeduksSy0WzmrMWd6KuBNiD2EbCdaaK29YVROjMG5e0AVwcTYtayDJ6Z0qtAWgyjq1ZgzOKYoBmHexmgSXQGYVDJDPrDTCUILIKA496dpFHG4y9f6Jn/GSxDCR/4IQAu21Aetut6dWGYC8HbGpCePTHBkQ3UIF5uARrUZbzGeebkK3uZPlK2BepzlTAE3lx/L7QmgTGKhhxzmE5HM8p2mJ7QKyf4HenwwJUcCojbGJY34j41lpUeNOUDM7ANU1tMquXtAMuJkT1PM/IIeEoBLXBBAJwyZI/lAiA75hCzYnmWMMwMrIzmeYY3CSigMYknBAEnR1PgkxiekQ6mPADigXXw5uN4wnENa0hGAUR9YE9MTQz7WwGu+RQDARuJiV0AtAwAdAAws8uO9va0Y9IHwABC2xsOB9YQ7kGzRHoA2GPjWewAn9FgGP/w0IEengfAuYbTPlhMYmbKfEJAJxhCzBugwUAGFYpbpJlycspTMVxPi+F1KWCeiSEBQn6NNRYAG+7eniBMmDRwWqC2zLBqZTwvgLuTnto47MUAGAPgbHLMuIeHXVjc+HOXd2lFE8QMwzaOBgAIVVhF6AgWAIaeSfrbAIqoPRwHzT1tyjAtnKhBjEwsz5hMvMLC2GNZ/nBv79cP+TFoMLTA7/YQMIAQh5/JAGB6lmgwfdiDT0F9EEws8RJkQsAD9+OYxqAPgDMjUMJR1Z4ogqCG3jaAhfVJWUcw+EYeZ7otpjHxQEETrSCe9dLsDg+q+5Wc0iCJjGhvrzcI9iqgQOOY7KmNg8M0dH4IdpiOXHJ+eHh+gfn05HJmgBNDh8vwLfYTBSSTIJjoHU+xbC2wtgIUk+Nr+hwtIUlfXJfhRvSgu44XFoWQ3PioEgnp7jqP7KV7A2MvA1WL0YOVpEGvdqIXPB2miUTwjwXwPI/nCfOOyzON/KV0cD4CDQbpOIgir94JPSUoCPF2gAWRHoyAFDPqa4JdUPp9ix4kx/JNtO0Uy04h3wppYiur1U7TAHAt/YZvhCsxSIV8cNjIAUB/PpfcS7jTQqucjnIUsCZ7VqfeZk1BtWd9ccuK2lSgycXxx2obWFEFPMmBTy20XXbH1wTtAwCu5R5wiIBOKAgrwIj4geNDj3MxjYl76ZNW6yTZCRhBm2jAOj2xtGZHKy06nj6TtwUEV+NdPszej7eSrhS+nIW7uzvjMflA/ntMiBMl4uUwJxIjioZ7/ZFPH4O1jfgOOQZxW5BUPWt+Emp4fRi9oKk2GDUCXIyidhNWObMe6vH2gAVo7B6fMkvaPLu+uzNN9+r/RdK9dAYHLxHpTbgBAu5B2jX2+tDfg/vRNU4iueMPx8f/fWpokMX907Hory5go4BWEFbwNUaqWrYBUN0eUGSn/HMH5q26zTJk3F6AC6bbtKXb3+9AbwqpBlaVESzGABgPK7QdgX7u+Bj+Tx/4AaRIvCRscboG/NRocEc1Swvb0egdVy5YbwM0yNR52tKbVorbZXwH6s18On0NfNAl7du5waeoohEjmNQA8IhhKtfX12062/pw/IGQ9Lgbe4aT7vItZ3yC22fSAQKO2Ma7Wl/1Go13A9EyJ+a2bSf4mkamT/cnRVlP7e5e8BPHHR1N03UcWFv2/qI6+ETCfoVYLCTtPiRhct3RRx+uAXBy7LFsOu3Oh3tQOvCX8yi5itKtcQ2W9KIZW+PgFxr9oqBtD4i+Rsj0yV4EfF+S2a/xJ47jjph0Z39f/tSonykAGA0zxmiyrPX2ZI55Z1x3BkdMs1lpx7vc7o4PFRdkS/BJyVjgpd15jqtx70btIdRsEbR5jUatetaZiG8D5J9uG2MpYRrcp9wn7l9Mulk/s0fhmV3KDSBIKt6kNooIVDkMd3zd8RozHN5GUE7n/XT6gNimAk7oFPwTvsHV/oWAZIjFZC/fAHcsnYWT4hsAC2TKa9lHWyWFInQrisxRBTLzSj2ZUuOcfzhcGsveHi3DmNqoDT4IjTG8fSAcH38ADeKfhdPwCpM61G4M1wfAhjE0Quj6HACsDaoh+xYNFpypGzwGBAXCIkgvEWR2mPnwGpq7s30dAUkbqgmaqy0A5Co427puZ4bt/xKAkBz4JqjHDKQxWUB+KBWLfQTcm9SWVsYZvRvV+gPVegNgQYxcl328DY21ool/yg2S9QXfzSRjGDWXAw1WvJnhYTbUakytRlb7GhmBAh6neyZeCmPC0mxPY1zt+xwm6okxG7XJaDRaalq//yZAw03mwOJ6timaMh6yNeEtj4+DGc8fJiauD3AnZ9i2osCDHjMBnNAhHNh4BUgIAhZMoevPJnC3WlrWEDCOMrOQgB7luj2R3wQYAuBq9UgWZFFWwDJZBd9S+PAhL42bdARn53Lgk8OK1RsGvWDZswCQG+FsC4eE8LMI+MGR8Y+PKrqTn3v0hHUN8kwwnM0mbFhxuH6nfjZTxe3zICTC+XRaENdLMN4xC/0+NPNUJwB4kL62VRtcMFftAyBtOSPDywAgfN/uXAtap9k+Tvg+OJaJBx7lmHdsBFRrtVrDG0KBOAqbkdUJ1cXMfJMGbZ9M74/bJpy6sNACBPyAtcJQGORG+3W1WgUXH9K5QmZIfRCynNERBtykWcFaAfjI3MN+TtWjrqNj43m1BMAR9CQ9xmoaaie0nubplwrW5PYzZOqHiZCOKzs98gEFACud/lGwXx/kckx/BYiicfk+B04Iz+bbsNQhHiHdAA/z6Xo09gPk8/oUsDch7DKEkjoMg5FYeIuJCw6hFeF9jvmIk95OJUPfMD1Ot+u2UEcLD/JqH1RXIaQCgALHL/sc2+yEE9JsE/rTJN01khNJ/ngc6YrCslSDld6kQiaViS5oeuC9ARC9bjbd3BDDx2jM4hZSBUt90oG1+GwfkgzHI2CAoxhomAOOH3GQqjvJBLgHeLCSpH0PpyRknB6TULDYmOVquJTMAjIhI8FSNKMvvsXEkGem042KUFQKhdXeXL3exqFzG6fl9TpuQPGp5V7ohYZBIFmDBhlYacl1MuQnyfgjPYYylpKOfRLg0UOOG42CYRTAf1boadpE3V6DlCiYT9l7i+fkgolD1WSkD+99vdoZGeQGTAv6divoG8Zo5vVCjp9ykAnb13RMiJeopNPYXmERC4RjNw4Vs1SsHY3eeRkymYSRZWjP1DI/WOpEYb4uuGgSXJh9+6wwsOm+No7y9+kuxGIw4PIIGHijAPtiBOQBcIQKxkxYgQWPrGZJc6wb3LyBgbxsQLNYGU5G4cwighYe/3CAKT4EtOfzJM8kefrjwsNdOUh85kAD1Z3hRB+SDADy3Zw3BDoCjbGBgJeQ5Gi9EFLASoYwM8roMFMovaaGJquK1Tgace1M1K/EmqHZz7jgw+uL7wJWvN8Qcxd3S0mBbjhYo/39fZULzgDQrnLCfj2Vyx21/JwxtAzLgMUYTTy9HCVOqHIG1oTtinXEYCyTXpz3/bQfCTo0UVBRc0GGeBErQCKc5F6fUT85noYbYngeOFnoykUw7H6yr6SN6rhvY3O1YF/7NBgwpyQX7IF5Axxc7gEgRklt0gy5WqPdxIMKpBETuuEEwQUJKgqLimaxjdHIgmejUTiy20vzpd3OlxKhOJu7QjZRn5gt42F/206G53RjqW559r4OFmbOycDIoI0hzUC64fIuAoKNg0aMgBBShMBaiK5IoH+fTuRysSBaTGO0DCvNmdUOO4b6/I77Y9cTNywe0c6TApaxYMHzHaai2HRTczXcTw0GNf48zBl7mT0SEYMm6rw7xX18Ak5IOyf4h8P+aObQw0gME1tVAFQAsAYqjK1OJ1yaL+00bV7GKW4I5hm8vol+U8KrP1N4sV8Zj6CoMh6sBU4813PES8YnOsxMJq5cLe9P8fQI224nmRAS5GQyoQdpVmKVqvDCLDOqLdvDidYUPM4UC+LrJr4DW3/V6MkA+oAp9yngSnIoAxQ80MNLkcVxq9mHwNWYqeMweHKmNkqEO0J5t0E46iv4BqhCoTcSmmFffe56V/KM8jZAbd+dFlYPFExrtKTbLvgHAijbgDICj+v2mh5Hx8J7esLnsAiIrRuSvXvXeCBsrJn4BiaQ1iwHXFDtm89dkkueGnZTFsTFPLP6zjbiOGahNu9zKe4TJfz0CfpP4Js7zcqE46xhRoXvpwT44gawce+o0CtIqQ7xuA+TzxNnkaWf3GMa3HLkCSpVoPjiUpcYdu2N915I3KTzpN8puiYELCoHPjeXKAhU1JgCH1tpDmc1DtzgXX6OfIYRNyjR0bujFRpucU7pX8DyHcOm9RKECXohnrx7PpmQBzZ9IngyAPLMaiWhlzZoAGkA5XQ6TeKRAT4yMwwgjGoUlxDkA8LkgBnde50mZO58PieoYENPxmVUhXicxhRfOFSxGRVPJZpLRvZuRphSUvLqyDRSzhxC8A0J8Hl/ZJqVYW8Uuwkf3WeaOdN58kfDgMz3fbqUEPzzSDND+JzYDFW4rC3NtX3F5zT4ogJFY847K0BY6ep0Vkkvc6WQXkB34UBdQdjMZJpYtRyOE75ki26Gl5utqDYkiqLQTpKKqEMg9xNtPrNoEPE1KWShsVv/SAGKfUjMWADSCwpWx849zxPCEDtguik2hLoqwh1HIxACyj+jguHFslAP0rWuF1VCobAiLCTXHD1/Wf3rgGJWwxNId4DXKL/9Rr/Qcx2dZNCbtOgZ1GEGh0GVP8LA8O73Og06b6XPoUDtlUHAde+DpiqWoD5cd5DbA0LB5fKfV/exzW1eP5TmvYDyokqyt/grLQ/C5GAebjSuJQGEFgAe3DxJLpbUpbVUi091+H+eQ1TTq3arhgAAAABJRU5ErkJggg==';

  // Mirrors the proposal's own MVP destinations & scores exactly — see the
  // comment above DESTINATIONS in backend/src/sources/kr/dataGoKrSource.ts
  // for the risk-component breakdown, and the .hwp's own mockup images
  // ([그림2]/[그림3]/[그림4]) for the tags/tips (Paris and Phnom Penh copy is
  // taken directly from the mockup screenshots where legible).
  var DEMO_DESTINATIONS = {
    FR: {
      countryName: '프랑스', regionName: '파리', contextLabel: '관광지', score: 72, status: 'caution',
      riskTags: ['소매치기', '여권 분실', '관광지 주변 범죄'],
      safeHowTips: [
        { icon: '🎒', text: '백팩은 앞으로 메고 지퍼를 잠그세요.' },
        { icon: '⚠️', text: '야외 테이블 위에 스마트폰과 지갑을 올려두지 마세요.' },
        { icon: '📔', text: '여권 원본과 사본을 분리해 보관하세요.' },
      ],
    },
    JP: {
      countryName: '일본', regionName: '오사카', contextLabel: '입국 전', score: 84, status: 'caution',
      riskTags: ['의약품 반입', '입국 유의', '여권 분실'],
      safeHowTips: [
        { icon: '💊', text: '처방전이 필요한 의약품은 반입 규정을 출국 전 확인하세요.' },
        { icon: '🛃', text: '세관 신고 대상 품목을 미리 확인하세요.' },
        { icon: '📔', text: '여권·수하물 분실·도난에 대비해 사본을 보관하세요.' },
      ],
    },
    KH: {
      countryName: '캄보디아', regionName: '프놈펜', contextLabel: '출장·장기체류', score: 52, status: 'warning',
      riskTags: ['고수익 취업제안', '여권 보관 요구', '최신 공지 5건', '긴급 연락처'],
      safeHowTips: [
        { icon: '📄', text: '출국 전 회사·계약서·사업자 정보를 반드시 확인하세요.' },
        { icon: '🔒', text: '여권 원본을 타인에게 맡기지 말고, 본인이 직접 보관하세요.' },
        { icon: '⚠️', text: '위험 상황 발생 시 재외공관 공식 연락처로 우선 연락하세요.' },
      ],
    },
  };

  function statusFor(score) {
    if (score >= 85) return 'safe';
    if (score >= 65) return 'caution';
    if (score >= 40) return 'warning';
    return 'avoid';
  }

  function demoDataFor(countryCode, regionName) {
    var known = DEMO_DESTINATIONS[countryCode.toUpperCase()];
    if (known) return known;
    var hash = 7;
    for (var i = 0; i < countryCode.length; i++) hash = (hash * 31 + countryCode.charCodeAt(i)) % 997;
    var score = 50 + (hash % 46);
    return {
      countryName: countryCode.toUpperCase(),
      regionName: regionName,
      contextLabel: '',
      score: score,
      status: statusFor(score),
      riskTags: [],
      safeHowTips: [{ icon: 'ℹ️', text: '실제 데이터 연동 전 표시되는 샘플 안내입니다.' }],
    };
  }

  function fetchIndex(apiBase, countryCode) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 3000);
    return fetch(apiBase.replace(/\/$/, '') + '/v1/safety-index/' + countryCode, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('musai-widget: bad response ' + res.status);
        return res.json();
      })
      .finally(function () { clearTimeout(timeoutId); });
  }

  /** score/100 ring drawn with a plain SVG circle + stroke-dasharray. */
  function gaugeSvg(score, color) {
    var r = 30;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
    return (
      '<svg width="76" height="76" viewBox="0 0 76 76" class="gauge">' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="7"/>' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" ' +
      'stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '" ' +
      'transform="rotate(-90 38 38)"/>' +
      '<text x="38" y="35" text-anchor="middle" font-size="20" font-weight="700" fill="#14231f">' + score.toFixed(0) + '</text>' +
      '<text x="38" y="50" text-anchor="middle" font-size="9" fill="#6b7a75">/100</text>' +
      '</svg>'
    );
  }

  function css() {
    return (
      '*{box-sizing:border-box;}' +
      '.widget{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#14231f;' +
      'border-radius:16px;padding:16px 18px;max-width:300px;box-shadow:0 2px 16px rgba(0,0,0,.12);}' +
      '.widget.sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;max-width:640px;' +
      'margin:0 auto;border-radius:18px 18px 0 0;padding:18px 20px 22px;box-shadow:0 -6px 24px rgba(0,0,0,.25);}' +
      '.widget.wide{max-width:580px;display:flex;flex-direction:row;align-items:flex-end;gap:14px;padding:20px 22px;}' +
      '.widget.wide .content{flex:1;min-width:0;}' +
      '.mascot-big{width:118px;flex:none;align-self:flex-end;margin-bottom:-20px;}' +
      '.head{display:flex;align-items:center;gap:10px;margin-bottom:12px;}' +
      '.avatar{width:34px;height:34px;border-radius:50%;flex:none;}' +
      '.headtext{flex:1;min-width:0;}' +
      '.title{font-size:13px;font-weight:700;margin:0;}' +
      '.subtitle{font-size:11px;color:#6b7a75;margin:0;}' +
      '.close{background:none;border:none;color:#6b7a75;font-size:16px;line-height:1;cursor:pointer;flex:none;padding:4px;}' +
      '.scorebox{display:flex;align-items:center;gap:12px;margin-bottom:10px;}' +
      '.scoretext{flex:1;min-width:0;}' +
      '.headline{font-size:13.5px;font-weight:700;margin:0 0 4px;}' +
      '.pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;color:#fff;}' +
      '.tags{margin:8px 0 12px;display:flex;flex-wrap:wrap;gap:6px;}' +
      '.tag{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:#fde8e8;color:#c0392b;}' +
      '.section-title{font-size:12px;font-weight:700;margin:0 0 8px;}' +
      '.tips{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:7px;}' +
      '.tips li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.4;}' +
      '.num{flex:none;width:18px;height:18px;border-radius:50%;background:#2563eb;color:#fff;' +
      'font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}' +
      '.icon{flex:none;}' +
      '.utilrow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;}' +
      '.utilbtn{font:inherit;font-size:10.5px;text-align:center;padding:8px 4px;border-radius:10px;' +
      'border:1px solid #e2e8e6;background:#f7faf9;color:#14231f;cursor:pointer;line-height:1.3;}' +
      '.utilbtn:active{background:#eef3f1;}' +
      '.feedback{display:flex;align-items:center;justify-content:space-between;gap:8px;' +
      'border-top:1px solid #eef1f0;padding-top:10px;}' +
      '.feedback span{font-size:11.5px;color:#6b7a75;}' +
      '.feedback .btns{display:flex;gap:6px;}' +
      '.fbtn{width:26px;height:26px;border-radius:50%;border:1px solid #e2e8e6;background:#fff;cursor:pointer;font-size:12px;}' +
      '.src{font-size:9.5px;color:#8a9793;margin:8px 0 0;}'
    );
  }

  function tagsMarkup(tags) {
    if (!tags || !tags.length) return '';
    return '<div class="tags">' + tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>';
  }

  function tipsMarkup(tips) {
    return '<ol class="tips">' + tips.map(function (t, i) {
      return '<li><span class="num">' + (i + 1) + '</span><span class="icon">' + (t.icon || '') + '</span><span>' + t.text + '</span></li>';
    }).join('') + '</ol>';
  }

  function bindInteractiveBits(root, el) {
    var closeBtn = root.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', function () { el.style.display = 'none'; });

    var fbtns = root.querySelectorAll('.fbtn');
    for (var i = 0; i < fbtns.length; i++) {
      fbtns[i].addEventListener('click', function (ev) {
        var span = root.querySelector('.feedback span');
        if (span) span.textContent = '피드백을 보내주셔서 감사합니다 (데모)';
        ev.currentTarget.style.background = '#e6f4ea';
      });
    }

    var utilBtns = root.querySelectorAll('.utilbtn');
    for (var j = 0; j < utilBtns.length; j++) {
      utilBtns[j].addEventListener('click', function (ev) {
        ev.currentTarget.textContent = ev.currentTarget.getAttribute('data-label') + ' (데모)';
      });
    }
  }

  function bodyMarkup(data, location, layout) {
    var isSheet = layout === 'bottomsheet';
    var isWide = layout === 'wide';
    var color = STATUS_COLORS[data.status] || STATUS_COLORS.warning;
    var label = data.statusLabel || STATUS_LABELS[data.status] || data.status;
    var headline = location + (data.contextLabel ? ' ' + data.contextLabel : '') + ' 안전지수 ' + data.score.toFixed(0) + '점';
    var inner =
      '<div class="head">' +
      (isWide ? '' : '<img class="avatar" src="' + MASCOT_DATA_URI + '" alt="" />') +
      '<div class="headtext"><p class="title">무사이 안전정보</p><p class="subtitle">여행지의 안전을 함께 지켜요</p></div>' +
      (isSheet ? '<button class="close" aria-label="닫기">✕</button>' : '') +
      '</div>' +
      '<div class="scorebox">' +
      gaugeSvg(data.score, color) +
      '<div class="scoretext"><p class="headline">' + headline + '</p>' +
      '<span class="pill" style="background:' + color + '">' + label + '</span></div>' +
      '</div>' +
      tagsMarkup(data.riskTags) +
      '<p class="section-title">✅ Safe-How 행동가이드</p>' +
      tipsMarkup(data.safeHowTips) +
      '<div class="utilrow">' +
      '<button class="utilbtn" data-label="🏛 공관 연락처 보기">🏛<br/>공관 연락처 보기</button>' +
      '<button class="utilbtn" data-label="📞 긴급번호 저장">📞<br/>긴급번호 저장</button>' +
      '<button class="utilbtn" data-label="📄 원문 출처 확인">📄<br/>원문 출처 확인</button>' +
      '</div>' +
      '<div class="feedback"><span>💬 이 정보가 도움이 되었나요?</span>' +
      '<div class="btns"><button class="fbtn" aria-label="도움이 됨">👍</button><button class="fbtn" aria-label="도움이 안 됨">👎</button></div></div>' +
      '<p class="src">' + data.sourceName + '</p>';

    if (isWide) {
      return '<div class="content">' + inner + '</div><img class="mascot-big" src="' + MASCOT_WIDE_DATA_URI + '" alt="" />';
    }
    return inner;
  }

  function render(el, data, location, layout) {
    var shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    var extraClass = layout === 'bottomsheet' ? ' sheet' : layout === 'wide' ? ' wide' : '';
    shadow.innerHTML =
      '<style>' + css() + '</style>' +
      '<div class="widget' + extraClass + '">' + bodyMarkup(data, location, layout) + '</div>';
    bindInteractiveBits(shadow, el);
  }

  /** Renders (or re-renders) one widget element with an explicit param set. */
  function renderInto(el, params) {
    var countryCode = params && params.countryCode;
    if (!countryCode) {
      console.warn('musai-widget: renderInto requires countryCode', el);
      return;
    }
    var regionName = params.regionName;
    var apiBase = params.apiBase;
    var layout = (params.layout === 'bottomsheet' || params.layout === 'wide') ? params.layout : 'card';

    var showDemo = function () {
      var demo = demoDataFor(countryCode, regionName);
      var loc = (regionName || demo.regionName)
        ? (regionName || demo.regionName) + ', ' + countryCode.toUpperCase()
        : countryCode.toUpperCase();
      render(el, {
        score: demo.score,
        status: demo.status,
        statusLabel: STATUS_LABELS[demo.status],
        contextLabel: demo.contextLabel,
        riskTags: demo.riskTags,
        safeHowTips: demo.safeHowTips,
        sourceName: '데모 모드 (실시간 API 미연결)',
      }, loc, layout);
    };

    if (!apiBase) {
      showDemo();
      return Promise.resolve();
    }

    return fetchIndex(apiBase, countryCode)
      .then(function (data) {
        var loc = (regionName || data.regionName)
          ? (regionName || data.regionName) + ', ' + countryCode.toUpperCase()
          : countryCode.toUpperCase();
        render(el, data, loc, layout);
      })
      .catch(showDemo);
  }

  function paramsFromAttributes(el) {
    return {
      countryCode: el.getAttribute('data-country'),
      regionName: el.getAttribute('data-region'),
      apiBase: el.getAttribute('data-api-base'),
      layout: el.getAttribute('data-layout'),
    };
  }

  function scan() {
    var elements = document.querySelectorAll('.musai-safety-widget:not([data-musai-initialized])');
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute('data-musai-initialized', 'true');
      renderInto(elements[i], paramsFromAttributes(elements[i]));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  window.MusaiWidget = { renderInto: renderInto, rescan: scan };
})();
