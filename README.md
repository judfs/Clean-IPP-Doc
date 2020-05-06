# Clean-IPP-Doc
Intel's documentation website is a chore to use. This repo creates a plain and useable version of the web docs. 

```
$ du -hs new plain dl
265M    new              # Documentation content with a table of contents on every page
21M     plain            # Actual documentation content
2.6G    dl               # All downloaded pages from Intel
$ ls -1 dl | wc -l
1206
```

Intel's pages are a lot larger than they are useful before they ever fetch aditional scripts.

More or less the process

```
wget https://software.intel.com/en-us/ipp-dev-reference-fast-fourier-transform-functions # get a page to scrape
python ./link.py # scrape toc
mkdir dl && cd dl
wget -l ../ipplinks.txt && cd .. # Download all pages. 2.6 G!
python clean.py # Extract just the documentation from every page
python links.py # Create a mapping of intel url redirects
python rewrite.py # Create new documentation pages with fixed relative links and a ToC
```
