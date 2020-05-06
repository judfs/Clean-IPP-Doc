from pathlib import Path
from bs4 import BeautifulSoup
import json




def parse_tree(tree, depth=0):
    # print('* '*depth, tree.name)
    depth += 1
    if tree.name == 'a':
        return {"name": tree.text, "dst": tree['href']}
    elif tree.name is None:
        return
    else:
        c = list(tree.children)
        if len(c) == 0:
            return
        # elif len(c) == 1:
        #     return parse_tree(c[0], depth)
        else:
            r = [parse_tree(elm, depth) for elm in c]
            return [it for it in r if it is not None]
    

def main():
    soup = BeautifulSoup(Path("ipp-dev-reference-fast-fourier-transform-functions").read_text(), features="lxml")

    tree = soup.find(id="block-book-navigation")
    links = ["https://software.intel.com" + a['href'] for a in tree.find_all('a')]  
    toc = parse_tree(tree)

    # Path("ipplinks.txt").write_text("\n".join(links))
    Path("ipptoc.json").write_text(json.dumps(toc, indent=2))


main()