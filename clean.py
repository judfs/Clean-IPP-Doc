from pathlib import Path
from bs4 import BeautifulSoup
import json


def Soup(it):
    if isinstance(it, str):
        return BeautifulSoup(it, features="lxml")
    elif isinstance(it, Path):
        return BeautifulSoup(it.read_text(), features="lxml")
    

def parse_tree(tree, depth=0):
    # print('* '*depth, tree.name)
    depth += 1
    if tree.name == 'a':
        return tree.text, tree['href']
    elif tree.name is None:
        return
    else:
        c = list(tree.children)
        if len(c) == 0:
            return
        elif len(c) == 1:
            return parse_tree(c[0], depth)
        else:
            r = [parse_tree(elm, depth) for elm in c]
            return [it for it in r if it is not None]
    

def main1():
    print("Running")
    soup = Soup(Path("ipp-dev-reference-fast-fourier-transform-functions"))

    tree = soup.find(class_="book-page-content")

    resoup = Soup(str(tree))
    Path("test.html").write_text(resoup.prettify())

    print("done")


def main_loop():
    print("Running clean")
    
    outdir = Path('plain')
    for path in Path('dl').glob('*'):
        soup = Soup(path)

        tree = soup.find(class_="book-page-content")

        resoup = Soup(str(tree))
        out = outdir / (path.name + '.html')
        out.write_text(resoup.prettify())

    print("done")

def main():
    main_loop()
main()