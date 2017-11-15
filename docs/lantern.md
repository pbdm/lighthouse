# Lantern

## Overview

Project Lantern is an ongoing effort to reduce the run time of Lighthouse and improve audit quality by modeling page activity and simulating browser execution.

## Accuracy

All of the following accuracy stats are reported excluding the 10% tail as the initial research found approximately ~10% of sites will radically vary simply by visiting the page a second time through no fault of the metrics or prediction logic. This means the accuracy is slightly overstated but should still hold for the  controlled-enivornment/repeated view use case.

Stats were collected using the [trace-evaluation](https://github.com/patrickhulce/lighthouse-trace-evaluations) scripts. Table cells contain [Spearman's rho](https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient) and [MAPE](https://en.wikipedia.org/wiki/Mean_absolute_percentage_error) for the respective metric.

| Comparison | FCP | FMP | TTI |
| -- | -- | -- | -- |
| Lantern predicting Default LH | .850 : 19.6% | .866 : 21.0% | .907 : 26.9% |
| Lantern predicting LH on WPT | .764 : 34.4% | .795 : 32.5% | .879 : 33.1% |
| Lantern w/adjusted settings predicting LH on WPT<sup>1</sup> | .769 : 32.9% | .808 : 31.1% | .879 : 32.6% |
| Default LH correlation with LH on WPT<sup>2</sup> | .808 : 30.0% | .818 : 31.3% | .819 : 39.5% |
| Unthrottled LH correlation with LH on WPT | .643 : 36.3% | .625 : 40.1% | .731 : 58.4% |

<sup>1</sup> 320 ms RTT, 1.3 mbps, 5x CPU

<sup>2</sup> Default LH traces and WPT traces were captured several weeks apart, so some site changes may have occurred that skew these stats

## Links

* [Lantern Deck](https://docs.google.com/presentation/d/1EsuNICCm6uhrR2PLNaI5hNkJ-q-8Mv592kwHmnf4c6U/edit?usp=sharing)
* [Lantern Design Doc](https://docs.google.com/a/chromium.org/document/d/1pHEjtQjeycMoFOtheLfFjqzggY8VvNaIRfjC7IgNLq0/edit?usp=sharing)
* [WPT Trace Data Set 1](https://drive.google.com/open?id=1Y_duiiJVljzIEaYWEmiTqKQFUBFWbKVZ) (access on request)
* [WPT Trace Data Set 2](https://drive.google.com/open?id=1EoHk8nQaBv9aoaVv81TvR7UfXTUu2fiu) (access on request)
* [Unthrottled Trace Data Set 1](https://drive.google.com/open?id=1axJf9R3FPpzxhR7FKOvXPLFLxxApfwD0) (access on request)
* [Unthrottled Trace Data Set 2](https://drive.google.com/open?id=1krcWq5DF0oB1hq90G29bEwIP7zDcJrYY) (access on request)
