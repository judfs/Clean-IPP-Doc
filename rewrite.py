from pathlib import Path
from bs4 import BeautifulSoup
import bs4
import json


def Soup(it):
    if isinstance(it, str):
        return BeautifulSoup(it, features="lxml")
    elif isinstance(it, Path):
        return BeautifulSoup(it.read_text(), features="lxml")


def codefix(soup, tree):
    """Attempt to improve function presentation.
    
    Intel's HTML here is not great or all that usefull. 
    There are tags for syntax highlighting but they don't actually represent anything. 
    """
    for code in tree.find_all(class_="dlsyntaxpara"):

        # This doesn't work great. More parsing would be needed for something good.
        if False:
            # A label in <strong> may come first
            label = code.find("strong")
            if label is not None:
                label.extract()
            text = " ".join(code.text.split())
            code.clear()
            if label:
                tmp = soup.new_tag("p")
                tmp.string = label.text
                code.append(tmp)
            tmp = soup.new_tag("p")
            tmp.string = text
            code.append(tmp)


def nodelinkfix(soup, tree):

    linkmap = json.loads(Path("nodemap.json").read_text())

    for link in tree.find_all("a"):
        try:    
            parts = link["href"].split("#")
            src = parts[0]
            if src.startswith("/node/"):
                
                dst = "./" + linkmap[src].split("/")[-1] + ".html"
                link["href"] = dst
        except:
            print("Failed on tag: ", link)


def linkit(soup, a):
    name = a["name"]
    dst = a["dst"]

    dst = dst.split("/")[-1] + ".html"
    tag = soup.new_tag("a", href=dst)
    tag.string = name
    return tag



def parse_tree(soup, tree, parent_tag):
    # Parent is not a list
    # unless it is... may be list item

    if len(tree) == 1:
        if isinstance(tree[0], dict):
            link = linkit(soup, tree[0])

            if parent_tag.name == "details":
                ulist = soup.new_tag("ul")
                parent_tag.append(ulist)

                li = soup.new_tag("li")
                ulist.append(li)

                li.append(link)
            else:
                parent_tag.append(link)
        else:
            parse_tree(soup, tree[0], parent_tag)
    elif len(tree) >= 2 and isinstance(tree[0], dict) and isinstance(tree[1], list):
        # li = soup.new_tag('li')
        # ulist.append(li)

        details = soup.new_tag("details")
        # li.append(details)
        parent_tag.append(details)
        summary = soup.new_tag("summary")
        details.append(summary)

        summary.append(linkit(soup, tree[0]))

        parse_tree(soup, tree[1], details)

        if len(tree) > 2:
            print(len(tree))
            # print(tree[2:])

    else:
        ulist = soup.new_tag("ul")
        parent_tag.append(ulist)
        for it in tree:
            li = soup.new_tag("li")
            ulist.append(li)
            if isinstance(it, dict):

                link = linkit(soup, it)
                li.append(link)

            else:
                parse_tree(soup, it, li)


def make_toc(soup):
    tree = json.loads(Path("ipptoc.json").read_text())
    nav = soup.new_tag("nav")

    parse_tree(soup, tree, nav)

    return nav


def expand_details(elm):

    while elm.name != "nav":
        if elm.name == "details":
            elm["open"] = ""
        elm = elm.parent


def expand_toc(toc, name):
    here = None
    for link in toc.find_all("a"):
        href = link["href"]
        href = href.split("/")[-1].split(".")[0]
        if href == name:
            here = link

    if here:
        here["class"] = "here"
        expand_details(here)


def main1(src_path, dst_path):

    soup = Soup(src_path)

    style = soup.new_tag("link", href="my.css", rel="stylesheet")
    soup.body.append(style)


    book = soup.find(class_="book-page-content")

    mycontainer = soup.new_tag("div")
    mycontainer["class"] = "mycontainer"
    book.wrap(mycontainer)

    codefix(soup, book)

    intelurl = "https://software.intel.com/en-us/"
    intelref = soup.new_tag("a", href=intelurl + src_path.stem)
    intelref.string = "original"

    book.insert(0, intelref)

    nodelinkfix(soup, book)

    toc = make_toc(soup)
    mycontainer.append(toc)

    expand_toc(toc, src_path.stem)

    dst_path.write_text(soup.prettify())


def test():
    print("Testing rewrite 1")

    # src_path = Path("test.html")
    src_path = Path("plain/ipp-dev-reference-fftinit-r-fftinit-c.html")

    dst_path = Path("test-out.html")

    main1(src_path, dst_path)

    print("done")


def main_loop():
    print("Running rewrite")

    outdir = Path("new")
    for path in Path("plain").glob("*.html"):
        main1(path, outdir / path.name )

    print("done")


def main():
    # test()
    main_loop()


main()
