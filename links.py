from pathlib import Path
from bs4 import BeautifulSoup
import json
import requests

def Soup(it):
    if isinstance(it, str):
        return BeautifulSoup(it, features="lxml")
    elif isinstance(it, Path):
        return BeautifulSoup(it.read_text(), features="lxml")
    
 
    

def main1():
    print("Running")
    soup = Soup(Path("test.html"))

    tree = soup.find(class_="book-page-content")

    resoup = Soup(str(tree))
    # Path("test.html").write_text(resoup.prettify())

    print("done")


def main_loop():
    print("Running link collection")
    
    linkset = set()
    for path in Path('plain').glob('*'):
        # print(path)
        soup = Soup(path)

        tree = soup.find(class_="book-page-content")

        try:
            links = [a['href'].split('#')[0] for a in tree.find_all('a')]
            linkset.update(links)
        except:
            print(f"Could not parse links from {path}.")


    Path("nodelinks.txt").write_text("\n".join(list(linkset)))
    print("done")

def map_links():
    intel = "https://software.intel.com"
    txt = Path('nodelinks.txt').read_text()
    linkmap = {}
    for link in txt.split('\n'):
        if not link.startswith('/node/'):
            continue
        url = intel + link
        req = requests.get(url, allow_redirects=False)
        dst = req.headers['Location']

        linkmap[link] = dst

    Path('nodemap.json').write_text(json.dumps(linkmap, indent=2))





def main():
    # main1()
    # main_loop()
    map_links()

main()