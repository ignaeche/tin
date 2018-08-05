// ==UserScript==
// @name         Tiny Improvements for Netflix (TIN)
// @namespace    https://github.com/ignaeche
// @version      1.05
// @description  Improve Netflix by viewing expiring titles at the top of your list, adding search links and more...
// @author       Ignacio
// @match        http://*.netflix.com/*
// @match        https://*.netflix.com/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAydJREFUeNrsWr160zAUlS07beDLxpQ+ANlY4AE6Zkk3FrqxNFsnNiY2pm5lYWsXNrqwNQ8AC1vzAOQF/PHTOLU5ilzhWLJklWI5H9LnIf6RfM/VufceKQ6+9R+RbW4h2fK29QAi8evJw22y++t3TyEPwAPwADwAD8AD8AA8gJKYa9IeZ+TpDRllZJj/ubgIyFVIvlAyDzsMYLIi0+WG3Rt3b5Gc9shF1DEKwesffpI317XWi4YH8BgeRpeuAIAp73/ZGXSHLv8KADwKUwa59aCDdcdh7joGwAel9eD6IixCFp7GIT82WNPp5a47APAfEo5s+usdlnDkEH+1rMJAdwyCLm4otL+qXkkC8ryvsB4NmQe3EsnWg5W7GRhlCiuTenfC0+cxOVpWJ4HEG6fPNoc9jYvZPkzZXRH6GA2eQlI2TqCOQvIM6NtZRD6Hui6wvoIQAKZp9SJ/O2iJ412vAGkNIJGrVWoYKwnUBNPniYmWZhyb5r21MTCnCq+c3HdynDQIEmCQ04kZwJXqzv4N+fSD5fhpWiSZdhpeZ02hGWWUUNYBmI7j6PYUtPlLPYeOZzHrO8xYnLxILTKyrpC97TGOGhufX6HnLmIWzUnj9I/khtpSJB/KwFxSJqhkhbKgllICQ5/Hdr6En0DZ5noOXhfWly/KknaU3UnMYRIgB2yrKWAAgybyRPtYw4DLxpo8bELQ8QNyvMu8YoXk5NosBOtiJrn3BQ1iekYLlcYF3F5eq+SEnjtcGUpH20tKUa3KBQsYDtZVU0ZirH2dWNSDBgiVcV/BBwTDIO88ADEzgKFcoDmgkCwbUadm1BzuXdmV4Om84uBx31CelMpiEbqgENcR8jJXT+jpUr1OcAAA1su1kO+vKPUjF6ryrRl1RCEuweXMyHd+cHABB3ogWnhlUC9xYncAMAnHO4w2GgFnVGkthHWozyqy0rIqDo43tsR2g20gQsNCAiZBGwCiJr6EmNNv7pajFrxvsyAE4nObJt9K8O31PSlqYTFbkYUteZ2UvpWIbJk979hfIv4vJg/AA/AAPAAPwAPwAP5nAJGs7/wMeAA27bcAAwBa7y0qtn/RnAAAAABJRU5ErkJggg==
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require      https://cdnjs.cloudflare.com/ajax/libs/i18next/11.5.0/i18next.min.js#sha256-OkYwGDArM5E/cUjqyUWhWooD5cUY3HmiwTQE9kiKa/s=
// ==/UserScript==

/**
 * Tested on Chrome 68+
 *
 * In order to use view expiring titles in your queue, you need to select "Manual Ordering" option in the following URL: https://www.netflix.com/MyListOrder
 * This preference is per profile, so if you choose to use "Manual Ordering" no other users are affected.
 *
 * */

let SEARCHES = {
    "imdb": {
        "name": "IMDb",
        "url": "https://www.imdb.com/find?q=%s",
        "useYear": true,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABZ0lEQVR4AY2StQLUQBCGZ9YuhrtbRYO7tbSU2AvwTDwAUmIN7u4uFdqd38V2dpmQa/D88ex+4/jh2sIgVB7+LwTIUqu0VkGoGwJkQVkLtoSGgGWAyurRkKCy8lA9fhHjWO8R4N3kD9Qe+Pv2w+z2o/GKJeb+s3TvnuTmw/G0KbI3oN7AbVkbtjR8+mYP75sWhsiAPHJg+o2H2ckzfefg+Jk+Apy+MOz23eOXWadDNx6kw7E7d3n08l0eh3LhLCGoBEfAYiAKxO3HqfeAwCcuWaj5vSjAGHz6Jn/wLGMPwpaeAe8Z8/Nmc0p+5jQ5ycRN7i2NgUYiXyVNFmqACKbGgteSWFjyzvlP30rexEya+wr2P5IuC1g4R+1cHy1baBbM0UajVtgfUnfgOj1atdTMmyUDg+Rgw+qQO4aXji4JI/3X0mPlnOU8CAHpqOSgmzbOYd3punHNRPVokGo6S1WVxmMi2xTIC/oOMPbWxI+43LUAAAAASUVORK5CYII="
    },
    "wikipedia": {
        "name": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Special:Search/%s",
        "useYear": false,
        "spaces": true,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAjUlEQVR4AWP4jwbIEvh0fP+pOweP3D1++O6Jw2+AAj/3eix725D1euqCDzPnfQNp+dvY//9a3IWVH3+veAUx43jU03/NaSf/394CNfRr9rL/x33v/t9yD2bL2tTPByPmvln3GybwMmb11l1xay4h3DEl4tb3rKofCIHrC//837sPyaV/f/3//+cPkX4BAP7w53hfR2QWAAAAAElFTkSuQmCC"
    },
    "google": {
        "name": "Google",
        "url": "https://www.google.com/search?q=%s",
        "useYear": true,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACkUlEQVQ4T2NkwALez58vwPz5Ver/L99M/jP8Y2Hi5LjNwM49ny+r4Ca6ckZkgddzO3nZH7/b+P3cKQfGr19Q5BgYmRiYdY3us2uqBfGkFV6A6YMr+jhnqsrf40fO/3lwhwebq2BiTJLSP4VtPXkZ09N/g8TABvyfNIn9/eXjr/7cu8MHU8gsp/iNSVbuAhML29d/715r/756SYqBm+c/p5tvOG9WwWoUF3xZULX82+LdEWBBJiYGDjev+byl9cmMDAz/YQq/TO2P/s/M+Ic3o2AlsgsZ//9nYPx1RP4XwydNlo+T3zOw2bhsE6hp9cbnDRQDft8qc2V41L8LJPiXzeTPt+sJIkLp6R9hino2/5jy9/9/IWwGinIx1jD+vZFd8+/JrGZwWPCZvGUzOy6CrDh80pdfrz8zsGIzIMCEJZ/x742c6n9PZraAFPzjNXnHbn5cmFgDAo1Zyxl/361yZrjfvQek6TyXx58TouHCeaoxn2CGtK3/sfbXv/9wQ8/c/WP37TcjOPbCzVkDwYH487DSzxWMzqzTnr1ncJWz2tZqWYQ1ECfv/Bmw/szv9SDNnKz//4eY8nCBTZpxsnfZnPvHIsGxyMjE4KVgt6jBLDeBgRERjVMOnrM7cUVt17MPDOwgdSaKzFe6ojh1wQZMuj2J/eSdBy9vfnzID3O6LK/EdwUemUsszMzf3377oHL9w10ZPV5HhnsXwxk4WVj++xizG6U5sl2AJ+Vpl5YqHX525sLtD4948aUBTX7dv6YsZQV5rlxT4EkZpqH74iLuD19frzv24oLL51/fmJANYmJkZNAR1nhuKKwelWsYewAlKaPbCDKI4c+fxK9/vpoyMPznYGfmuMvNxLUkzyjmGrpaAKZq/PMMIXR7AAAAAElFTkSuQmCC"
    },
    "rt": {
        "name": "Rotten Tomatoes",
        "url": "https://www.rottentomatoes.com/search/?search=%s",
        "useYear": false,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABgFBMVEUAAAAAkSwAkSwAkSwDkCwAmi/5MQlyYhsAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkSwAkiwAky0Aky0DkCwNjSoAoTIAlS0Aky0EkCwHjisAkSwfhSgngidAeSN4YxunURXZPQ3/LghWcCBBeCM5eySDXhpHdiILjSuwTRPnOAzwNAr8MAn5MQn5MQn6MQn1MgnvNQrxNAqEXhmiUxX1Mwr5MQn5MQn5MQn5MQn4MQn4Mgn8MAn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQn5MQkAkiz9MAj6MQnvNQr7MAn6MQn5MQn5MQn6MQn6MQn5MQn5MQn5MQn5MQn5MQn///8IscoRAAAAcHRSTlMAAAAAAAAAAFWiET1ECgs8etip7LkhAQRr2fn8/9y9pF0MC2HP/f7/+/z+/vWeIV3u/vn5/fr8/f/DJRO1/v35+/6jCmf4//7/70i1jtqz3bbBknr88EshzKIKSOPCJABCwvrxnyIYbb/s/frhqE4K0dAo8QAAAAFiS0dEf0i/ceUAAAAHdElNRQfiCAMAOBch0c06AAAAwUlEQVQY02NgYGBk5ODk4ubhZWQAA0ZGPn4BQSFhEVExJmawgLiEpJS0TIGsnLyCIgtQgFVJWUVVTV1DU0tbR1ePjY2BXd/A0MjYxNTM3KKwyNKKjcHaptjWzt7BsaS0rLy83MmZwcW1otLN3aOquhwEPL0YvIFUTW1dORT4MPiWowA/Bn9UgQCGQFSBIIbgEGR+aBhDeASyQGQUA1t0DIIfG8fGwBafkJgE4SanpAKdzsDGlpaekZmVnZOblw/kAgAQSk3/25BS5gAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0wOC0wM1QwMDo1NjoyMy0wNzowMKdZyvkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMDgtMDNUMDA6NTY6MjMtMDc6MDDWBHJFAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAABJRU5ErkJggg=="
    },
    "mc": {
        "name": "Metacritic",
        "url": "http://www.metacritic.com/search/all/%s/results",
        "useYear": false,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABvFBMVEUAAAD/2x3/3Br/3R7/3hf/1SqnjkSIc0VtWzN7Zy/jvDT/4hr/4BCeiUI1NTQZHyoAChcqLzkwMz4VGx9oXTb/4iP/0yyBckEFEyMhJi4eICBlYWD///+Mi5QAARRGQC2yl0EPGCctLzIWGhgaHh7X1dTn5eW6t7YAABFoWTH/5Bv/2iBGQjkaISskJiRQTU2YlJQkJiYaHR3V09Klpq4kJyzUsC/PqkApLDEBCg1QTExpZWUAAAInKSnU0dFcXm1wXSr/3RymjUQPFyEuLy/Oy8u9urp5dHRva2o+PDyMiIcXHyl0Yz7/3CGGcDA1OEFZVlUDAABkYGCBfX0bHh4RGiWAbUf/3BvAnTYkJy2sqq3Qzs4zMzNmY2LAvLwjJSUyMjEXHimYgET/3B3/3ig5Ni0AAA+tqKXf3d0HDw8uLi0oKzAqLDDnwDa+okYABxkKExevqqc6OTkRFhYwMDA3NzcCECKDcUP/4A2Le0YAAhYABhLGw8Pa2NYxMTEtLi4mKS8DECJcVD7/3xGqk0YrLCoYHSgHEx8cIi0sLjF9b0H/0y3/3Bj/2i2ehDl+ajyNd0idhULsxDT/2x8RlHs5AAAAAXRSTlMAQObYZgAAAAFiS0dEHJwEQQcAAAAHdElNRQfiCAMBAxZrpnijAAAA5ElEQVQY02NgAANGJmZmBgRgYWVj5+Dk4obxeXj5+AUEhYRFRMUgfHEJSSlpGRlZOXlREJ9JQVFJWUVGVU1GXUNTCyigraOrp28gY2hkLGNiagYUMLewtJKRkbG2sbWTsXdwZGB0cnZxdXOXkfGw8fTy9mFi8PXzl5EJCAySkQkOCQkNC2dgiIiMkomOsYmViYtPSExKZmBISU1Ll8lwyQyIycrOyQW5Oi+/oFBGpqi4pLSsnAfkkIrKquqa2rr6hsYmFojTm1ta20LbOzq7WLqhnunp7eufMHFSM5J/JyeHJ0NYAPqtMJ5Tbi+hAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTA4LTAzVDAxOjAzOjIyLTA3OjAwS8Z/zgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wOC0wM1QwMTowMzoyMi0wNzowMDqbx3IAAAAASUVORK5CYII="
    },
    "youtube": {
        "name": "YouTube",
        "url": "https://www.youtube.com/results?search_query=%s",
        "useYear": true,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAyVBMVEUAAAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/ExP/Cwv/aWn/qan/NDT/AgL/c3P/////6Oj/goL/EBD/6Oj/goL/EBD/aWn/qan/ExP/Cwuhhl/PAAAAMHRSTlMAAAMYKjU8QkQqGQMHd9nq8PT3+OrZeDnp6Tlg+vpgdv7+doKC2enw9OkYKjU8Khlzuyh4AAAAAWJLR0Q4oAel1gAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+IIAwQKJpp2Ma0AAACKSURBVBjTY2AgCBiZmFlY2dg5ONjZWDm5uBkZeHj5+AUEhYSFhQQFRETFeBjEJQyQgKQUg7QMiGFoBBGQlWOQVwAxjE1MzUC0ohKDMljG3MLSyhrEUIEL2NjaQQQgWuwd4Foghjo6wQ3FsJaHV1VNXQPkMA11TZDDGJm0tHV0QU7X1dHTBzqdIAAA5eYbZ8jEF9kAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMDgtMDNUMDQ6MTA6MzgtMDQ6MDAGP1ggAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTA4LTAzVDA0OjEwOjM4LTA0OjAwd2LgnAAAAABJRU5ErkJggg=="
    },
    "amazon": {
        "name": "Amazon",
        "url": "https://www.amazon.com/s/?url=search-alias%3Daps&field-keywords=%s",
        "useYear": false,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0T///////8JWPfcAAAAB3RJTUUH4ggDARcJyACiAwAABNJJREFUSMedlW1M1VUcxz//y727V7pICWjiA1LjwUQwNxeamoZIjXDtEllZ0QtXL0qsTTJarBDBHqUSXJNp0CpWmQ8bkOJmq5ZOimsqpiKmIA+iPN7L8F683G8vLi/Mhqy+bz5nO+ds331/352DJEkzPglwZ26ALkO3apu2aZvkcro6XB1Sa0nr/tb9UvtgR3RHtORJ8Tg8Do2jgcUB7ugMcNomAovPdwc4knzrld703rW9a6WSx0vaS9qllXelRaZFSnFPxmfFZ0lzmxJbEluk1T8/9cVTX0h179S117VL/iX+pf6lYxnx/TRq5MaoAfcvtx7xnPKc8pyS1pXmpOakSua5lihLlBRUZY41x0oRayavnrxasn02Yd2EdRIASFExszJnZUr1ufVH6o+Ml0h/HmNtHXf+EfZHmDSl4+6zd5+VjGWmIlOR9PKJV/JfyZcatzcebTwqbQnbUralTJoQGhwVHCUZy0xrTWulj45vfXbrs+MZkMyMoWmDkW2RbVCStrV8azn03dv3TN8zkO5Mv5p+FaYfml42vQx67b3hveFg326vtlfD9fSh4KFguPbXtY3XNgLzuK3GNBCxJMIWYYOMpIwzGWeg9kxtT20PFI5sbtjcABdXXEy6mASdyZ3xnfHgOuKqd9UDbxpewwu+/T6nzwk4bm/ANNbGgDFgH7BDTuH6peuXwvOzspuym6BqR1VbVRsYjcZh4zAkxia6El1g9VuHrcNAMRVUANFEE834Gms237z7bdC3QZL1nK3H1iMFZZsLzAVS/ov57ny35HF53B635DQ7M52Z0uSSKQenHJSAPeyRcu/MvZB7YfwOjJlAo6Nxe+N28L7q/dL7JVjLbMW2YnigOHlN8hqwhljtVjuc7TxnOmcCt9fd7G4Gphp5Rh64nnSvcq8CVahKVf+jA6H20ObQZjBmGpOMSeAt8hR6CqHysUpfpQ+6zF2JXYlQtrD0/dL34bp/KGUoBYyDpixTFtSlHoo5FAOni07PPj0bEkgg4b+M4MT5k+Enw6XZxfd9cN8HEtBGm8RiCiiQjHzTAdMBKemreZXzKqXH3sp4OuNpybzA8oZlg7S84uGKh5uk82eaVzXXjD0CQ1LwyNsSeKKvOgCsC8M/BZYbPnMS/H64oaWhHr5/cPcPu8vhyv1dqV0rIe6OOHOcGRw5jlZHK4Sk2OPscbCnZG//3nh4dCgtaYUP7nliUrL7OYB+y591AGEzFuQBTFwcbwQSKJFNktrDqp2S/H8a752VNNRvObVJkt9f60u9ybJ//GKNvqXXu2dK0rl7t12XpN+619VJ0qXvqub/MwFJ7kWg6BuX7b+iyxn7XgD6L/ZVLAcMy4ehg8CE8M3J8wFryIy4IkCW8NA7gRF2aSIw5E3oPgr4B1oa04DhvmvHh4EIe02MBzBCCmMfAYhg0S6AkNKYhoElowZ29gYakT0EtPJj0DQYLL8wF/C2fPz1a4C5o7r2EhDkOXbldeCCNigBmGQcC7ofIOgXazdwR2jNnC7AMtO72g0YUwse3QjAcmMGgDnVVjryPPCTiZ2xoyWcfk+AOwZGP4lXb8qyVg5J8pzvTpHk73not+8kDXbMOfCSJP+Vd3+cL0mumqZhSRqJ96z/1zx8AfTtC/CzZQFGpv0NJaJBQ1YMATAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMDgtMDNUMDE6MjM6MDEtMDc6MDBgZ9vvAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTA4LTAzVDAxOjIzOjA5LTA3OjAwItUtNAAAAABJRU5ErkJggg=="
    },
    "ddg": {
        "name": "DuckDuckGo",
        "url": "https://duckduckgo.com/?q=%s",
        "useYear": true,
        "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACp0lEQVR4ATWQA5AsVxRAz3vDtb3f/uvYtlGIbRdj2zbKjm3bttfesXrezbtJ/q06g+5zbsPy/4wcuEqJe/b03D5y0KqnPa8q+luP6bn/HTaMHfZ/hg9YhRM6BS4QkRMkKPVKECwTJytFUJYJ9HpOUEddbbS1zqFxF3CRDzaW+rbNYjsctGNsYNte4tVLXFBeIkKvZ0fPZp6N1dVGWyti4sDJIqi4dTla0U3fVqbunBtp8sTWb4KYECIYT7c66mqjrRXY2Ynp9fQ5R12kYwnVa4YI1zVRsfkuNJx3L+Gt9sU58I5Sp6422loRdvfU6fZyOIrZ/iCSNd2orFOubEB2OQLb1I44QQTU1UZbXbDU0yoixtkwtqaWsak5vvxxDJ1SqcgXc2Gkex2u7CAsiMFoo60uqPTU+B68XJgap7Y6TnVVDJ2qyAJb9yWoG0jRuPcCjQfME24q4Rw12loHbIBSQOGvX1jSWcfaZS1I7hP4/WDiXxxK2L5KkI+QeLea4kwY+b+xImQ9KQ8iQjD8G6VcFnSCLMWRP0m8V2Th3TjBXBgTFVxgENAmqwv+8kx5RDC4iWHy83PoONfH7Gs9BGlLpDmAkFCcC6GuNtrqgpc8Cc+oLmB+huz4MDq2shoTWkrqqzhT79Wx8JG/fX2hMKqNtlbgVRHznRPzjcMmTC5H1r+Ht8Ze5IPZd/hjsJ0Ptq7n/W3qcSEAk1BXG22tiMkL3CfCn573KQejhT9/kS8m3ueRb27mseYf+W7rbmYbw1I2ZtR5R11ttLXOgd4+cLUIn3k+cmN/v73OLp86es0Z6TP7L8+fWNhtcuMPEm+aQD5SR11ttLV9r/xE78s/4XQJXCM29LD57tNvl9/z+G9L7ntqNHL7XZORZ1/+u3u48B3Cw+qoq422/wAmkMrhPOAtYwAAAABJRU5ErkJggg=="
    }
};

let CATEGORY_ICONS = {
    "movie": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAASElEQVR4AWMY3OD///8TgNgcyp4MxAfQ8GSonDlILW6DIGABEDv8xw0coGr+4zaIREAPF9Hfa6NeG/UaoUxrSkSmNQVn2kENAMn3cyemVPyWAAAAAElFTkSuQmCC",
    "tv": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAQAAAD8x0bcAAAAZ0lEQVR4AbXKsRVAMBRG4X8ARjABG4A3gaEYwQJGyTKOMiNchRQUyUkR97afSsaKS7xJogV8lHigEwYsisQCzA+yKLJcNBVDYzE0ZKIJOLDIB9CLmotUJ5UkGiz8zsKNvrHjwrt+6QYs8N8NvN/45QAAAABJRU5ErkJggg=="
};

let COLORS = {
    PAGE_BG: "#141414",
    EXP_BG: "#aa0000",
    IMG_BG: "#FFFFFF",
    ACTION_LINK: "#FFFFFF"
}

let SELECTORS = {
    EXPIRING_TITLES: "tin-expiring-titles",
    TITLE_PAGE_LINK: "tin-title-page",
    TITLE: "tin-title",
    CAT_ICON: "tin-cat-icon",
    DURATION: "tin-duration",
    TOTAL_DURATION: "tin-total-duration",
    SEARCHES: "tin-searches",
    ACTION_LINK: "tin-action-link",
    ACTIONS: "tin-actions",
    IMG_PREFIX: "tin-img-"
}

let ATTRS = {
    TITLE: "tin-title",
    YEAR: "tin-year"
}

let CSS = `
#${SELECTORS.EXPIRING_TITLES} { background-color: ${COLORS.EXP_BG}; margin: 0 4% 20px; padding: 25px 25px 10px; border-radius: 25px; }
#${SELECTORS.EXPIRING_TITLES} > div { margin-bottom: 15px; vertical-align: middle; }

#${SELECTORS.EXPIRING_TITLES} > div:hover .${SELECTORS.TITLE_PAGE_LINK} a { text-decoration: underline; }

.${SELECTORS.TITLE_PAGE_LINK} a { font-weight: 700; }
.${SELECTORS.TITLE_PAGE_LINK} a:hover, .${SELECTORS.TITLE} a:hover { text-decoration: underline; }
.${SELECTORS.TITLE} { display: block; width: 100%; }

.${SELECTORS.CAT_ICON} { vertical-align: inherit; margin-right: 10px; background-color: ${COLORS.PAGE_BG}; padding: 2px; border-radius: 5px; }
.${SELECTORS.DURATION} { vertical-align: inherit; margin-left: 10px; background-color: ${COLORS.PAGE_BG}; padding: 2px 5px; border-radius: 5px; font-size: 8pt; }
.${SELECTORS.TOTAL_DURATION} { display: inline-block; color: #FFFFFF; margin-left: 25px; }

.${SELECTORS.SEARCHES} { display: inline; margin-right: 10px; vertical-align: middle; }
.${SELECTORS.SEARCHES} a { margin: 0 1px; vertical-align: inherit; }
.${SELECTORS.SEARCHES} img { background-color: ${COLORS.IMG_BG}; padding: 1px; border-radius: 100%; border: 1px solid ${COLORS.EXP_BG}; transition: border 0.4s ease-in-out; }
.${SELECTORS.SEARCHES} img:hover { border-color: ${COLORS.IMG_BG}; }

.title .${SELECTORS.SEARCHES} { display: block; margin: 2px 0 0 0; }
.jawBone .${SELECTORS.SEARCHES} { display: block; margin: 0 0 5px 0; }
.title .${SELECTORS.SEARCHES} img, .jawBone .${SELECTORS.SEARCHES} img { border: 1px solid ${COLORS.PAGE_BG}; }
.title .${SELECTORS.SEARCHES} img:hover, .jawBone .${SELECTORS.SEARCHES} img:hover { border-color: ${COLORS.IMG_BG}; }

.${SELECTORS.ACTIONS} { float: right; }
.${SELECTORS.ACTION_LINK} { font-size: 10pt; border-bottom: 1px solid ${COLORS.ACTION_LINK}; padding: 5px; margin-left: 10px; transition: all 0.4s ease-in-out; }
.${SELECTORS.ACTION_LINK}:hover { color: ${COLORS.EXP_BG}; background-color: ${COLORS.ACTION_LINK}; border-radius: 5px; }

.match-score-wrapper.no-rating { display: none; }
.jawBoneContainer .jawBoneCommon .simsLockup .meta .match-score-wrapper { width: auto; }
.episodesContainer .single-season-label { display: inline-block; }
`;

(function() {
    'use strict';
    var $ = window.jQuery;
    var i18next = window.i18next;

    i18next.init({
        lng: 'en',
        ns: 'translation',
        load: 'languageOnly',
        resources: {
            en: {
                translation: {
                    cats: {
                        tv: "TV Series",
                        movie: "Movie/Special"
                    },
                    actions: {
                        bringToTop: "Bring to Top &uarr;",
                        viewInList: "View in List &darr;",
                        removeFromList: "Remove from List"
                    },
                    list: {
                        refreshing: "Refreshing your list...",
                        title_empty: "There are no titles in your list expiring soon!",
                        title: "The following title in your list is expiring soon:",
                        title_plural: "The following {{count}} titles in your list are expiring soon:"
                    },
                    season: {
                        percentage: "{{percentage}}% completed",
                        remaining: "{{remaining}} out of {{total}} minutes remaining",
                        average: "{{average}}-minute episode average"
                    },
                    consoleManualOrderingMessage: "Remember that in order to view the expiring titles in your list, you need to set 'Manual Ordering' in the following URL: https://www.netflix.com/MyListOrder"
                }
            },
            es: {
                translation: {
                    cats: {
                        tv: "Serie de TV",
                        movie: "Pel\u00EDcula/Especial"
                    },
                    actions: {
                        bringToTop: "Traer al Inicio &uarr;",
                        viewInList: "Ver en Lista &darr;",
                        removeFromList: "Remover de Lista"
                    },
                    list: {
                        refreshing: "Recargando tu lista...",
                        title_empty: "No hay t\u00EDtulos en tu lista que expiren pronto!",
                        title: "El siguiente t\u00EDtulo de tu lista expira pronto:",
                        title_plural: "Los siguientes {{count}} t\u00EDtulos en tu lista expiran pronto:"
                    },
                    season: {
                        percentage: "{{percentage}}% completado",
                        remaining: "{{remaining}} de {{total}} minutos restantes",
                        average: "{{average}} minutos promedio por episodio"
                    },
                    consoleManualOrderingMessage: "Recuerda que para ver los t\u00EDtulos por expirar en tu lista, debes seleccionar 'Orden Manual' en la siguiente URL: https://www.netflix.com/MyListOrder"
                }
            }
        }
    }, (err, t) => {
        if (err) return console.err("TIN: 18next error!", err)
        console.log('TIN: i18next loaded successfully!')
    });

    i18next.changeLanguage(unsafeWindow.netflix.notification.constants.locale)

    addStyle()
    // Observe changes to body
    new MutationObserver(function(list) {
        // Modify "My List"; add Expiring Titles box and add searches to every item
        modifyMyList()
        // Add searches in title pages
        modifyTitlePages()
        // Add titles under images in "More Like This"
        modifyMoreLikeThisTab()
        // Show completed percentage, remaining minutes, episode average
        modifyEpisodesTab()
    }).observe(document.body, { attributes: true, subtree: true })

    // Add styles
    function addStyle() {
        GM_addStyle(CSS)
        $.each(SEARCHES, function(index) {
            var item = SEARCHES[index]
            GM_addStyle(`.${SELECTORS.IMG_PREFIX}${index} { content: url('${item.icon}') }`)
        });
    }

    // In "My List" if a title has 'seasons' then the duration is wrapped around a span with class test_dur_str
    function isTVShow(element) {
        return $(".test_dur_str", $(".duration", element)).length;
    }

    function makeCategoryIcon(element) {
        var img = $("<img>", { class: SELECTORS.CAT_ICON })
        if (isTVShow(element)) {
            img.attr({
                src: CATEGORY_ICONS.tv,
                title: i18next.t('cats.tv')
            })
        } else {
            img.attr({
                src: CATEGORY_ICONS.movie,
                title: i18next.t('cats.movie')
            })
        }
        return img
    }

    // Make search links
    function makeSearches(title, year) {
        var query = title
        var queryYear = query.concat(` (${year})`)

        // Create links div
        var links = $("<div>", { class: SELECTORS.SEARCHES, [ATTRS.TITLE]: title, [ATTRS.YEAR]: year })

        // Iterate over searches
        $.each(SEARCHES, function(index) {
            var item = SEARCHES[index]

            var finalQuery = item.useYear ? queryYear : query;
            if (!item.hasOwnProperty("spaces") || !item.spaces) {
                finalQuery = finalQuery.replace(/\s/gi, '+')
            }

            var link = $("<a>", { href: item.url.replace('%s', finalQuery), target: "_blank" })
            link.append($("<img>", { class: `${SELECTORS.IMG_PREFIX}${index}`, title: item.name }))
            links.append(link)
        })
        return links;
    }

    function makeSearchesFromRow(element) {
        return makeSearches($(".title", element).text(), $(".year", element).text())
    }

    // Get expiring titles
    function getExpirations() {
        return Array.from($(".rowListItem")).filter(function(title) {
            // If 'notes' has text, then title is expiring
            return $(".notes", title).text();
        });
    };

    function makeActionLink(href, text) {
        return $("<a>", {
            class: SELECTORS.ACTION_LINK,
            href: href,
            html: text
        })
    }

    // Create div with expiring titles
    function makeExpiringTitles(titles) {
        // Create div and prepend to container
        var div;
        if ($(`#${SELECTORS.EXPIRING_TITLES}`).length) {
            $(`#${SELECTORS.EXPIRING_TITLES}`).empty()
            div = $(`#${SELECTORS.EXPIRING_TITLES}`)
        } else {
            div = $("<div>", { id: SELECTORS.EXPIRING_TITLES });
            $(".rowListContainer").prepend(div)
        }

        // Prepare title
        var titleDiv = $("<div>")
        div.append(titleDiv)
        // If list is refreshing, then say so and return; otherwise show title
        if ($(".rowListSpinLoader").length) {
            titleDiv.text(i18next.t('list.refreshing'))
            return;
        } else {
            var options = { count: titles.length }
            if (titles.length == 0) options.context = 'empty'
            titleDiv.text(i18next.t('list.title', options))
        }

        // Iterate over expiring titles
        $(titles).each(function () {
            // Create item div and append
            var item = $("<div>")
            div.append(item)

            // Create searches
            item.append(makeSearchesFromRow(this))
            item.append(makeCategoryIcon(this))
            item.append(
                $("<span>", {
                    class: SELECTORS.TITLE_PAGE_LINK,
                    html: $(".title a", this).clone().wrap("<p>").parent().html()
                })
            )
            item.append(` (${$(".year", this).text()})`)

            // Duration
            item.append($("<span>", { class: SELECTORS.DURATION, text: $(".duration", this).text() }))
            item.append(" &rarr; ")
            item.append($(".notes", this).text())

            var links = $("<div>", { class: SELECTORS.ACTIONS })
            item.append(links)
            // Bring to Top link
            if ($(".move-to-top", this).length) {
                links.append(makeActionLink(`javascript:document.querySelector("#${this.id} .move-to-top").firstElementChild.click()`, i18next.t('actions.bringToTop')))
            }
            // View in List link
            links.append(makeActionLink(`javascript:document.querySelector("#${this.id}").scrollIntoView({ behavior: "smooth" })`, i18next.t('actions.bringToTop')))
            // Remove from List link
            links.append(
                makeActionLink(
                    `javascript:if (confirm("Are you sure you want to remove ${$(".title a", this).text()}?")) document.querySelector("#${this.id} .remove").firstElementChild.click()`,
                    i18next.t('actions.removeFromList')
                )
            );
        })
    }

    // Append search links to every item on "My List"
    function appendSearchesToMyListItems() {
        $(".rowListItem").each(function() {
            // Do not append if already present
            if ($(`.${SELECTORS.SEARCHES}`, this).length) return true;
            $(".title", this).append(makeSearchesFromRow(this))
        });
    }

    var consoleMyListMessage = false;

    function modifyMyList() {
        // If we are not on "My List", return
        if (!$(".rowListContainer").length) {
            // Let user know through console how to use manual ordering
            if (document.URL.includes('my-list') && !consoleMyListMessage) {
                consoleMyListMessage = true
                console.info(i18next.t('consoleManualOrderingMessage'))
            }
            return;
        }
        makeExpiringTitles(getExpirations());
        appendSearchesToMyListItems();
    }

    function modifyTitlePages() {
        $(".jawBone").each(function() {
            var title = $(".title", this);
            var query = title.text() || $("img", title).attr("alt");
            var year = $(".year", this).text();

            // If already present, remove and reappend if titles don't match (after a loading state this makes the links correct)
            if ($(`.${SELECTORS.SEARCHES}`, this).length) {
                if ($(`.${SELECTORS.SEARCHES}`, this).attr(ATTRS.TITLE) === query) return;
                $(`.${SELECTORS.SEARCHES}`, this).remove();
            }

            $(this).prepend(makeSearches(query, year))
        })
    }

    function modifyMoreLikeThisTab() {
        $(".jawBone #pane-MoreLikeThis .slider-item").each(function() {
            try {
                // If title already present, return
                if ($(`.${SELECTORS.TITLE}`, this).length) return true;
                // Get title from artwork
                var title = $(".video-artwork", this).attr("alt")
                // Decode embedded JSON to extract video_id
                var content = JSON.parse(decodeURIComponent($(".ptrack-content", this).attr("data-ui-tracking-context")))
                // Create anchor
                var a = $("<a>", { href: `/title/${content.video_id}`, text: title })
                var span = $("<span>", { class: SELECTORS.TITLE })
                span.append(a)

                $(".meta", this).prepend(span)
            } catch(e) {
                return true;
            }
        });
    }

    function modifyEpisodesTab() {
        // Get total watch time of season
        $(".jawBone #pane-Episodes").each(function() {
            var durations = []
            // Retrieve all episodes in a season
            $(".episodeWrapper .slider-item", this).each(function() {
                // Get progress through progress bar width
                var progress = 0;
                if ($(".progress-bar", this).length) {
                    progress = parseInt($(".progress-completed", this).attr("style").match(/\d+/)[0])
                }
                // Get minutes
                var minutes = parseInt($(".duration", this).text())
                // Calculate remaining
                var remaining = Math.ceil(minutes * (100 - progress) / 100)
                durations.push({ remaining, minutes })
            });
            // Reduce into totals
            var remaining = durations.reduce((acc, cur) => acc + cur.remaining, 0)
            var total = durations.reduce((acc, cur) => acc + cur.minutes, 0)
            var average = Math.ceil(total / durations.length)
            var percentage = Math.floor((total - remaining) / total * 100)

            // Remove and check for valid data
            $(`.${SELECTORS.TOTAL_DURATION}`, this).remove();
            if (!durations.length || isNaN(remaining)) return true;

            // Append
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.percentage', { percentage }) }))
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.remaining', { remaining, total }) }))
            $(".episodeWrapper", this).before($("<div>", { class: SELECTORS.TOTAL_DURATION, text: i18next.t('season.average', { average }) }))
        });
    }
})();