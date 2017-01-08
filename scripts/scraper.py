#!/usr/bin/env python
# -*- encoding: utf-8 -*-
"""
output tuples of matched date lines in wikipedia articles
"""

from bs4 import BeautifulSoup
import requests
import re


DATE_EXPRESSION = re.compile('([^\.]*)([JFMASOND][a-z]+[\ ,0-9]*[1-2][0-9][0-9][0-9])([^\.]*)\.', re.MULTILINE)

urls = [
    'https://en.wikipedia.org/wiki/Joni_Mitchell',
    'https://en.wikipedia.org/wiki/Tom_Petty',
    'https://en.wikipedia.org/wiki/Paul_Simon',
    'https://en.wikipedia.org/wiki/American_Revolutionary_War'
]

dates = []
for url in urls:
    dates.append([('', '')])
    dates.append([(url, ' ***')])
    dates.append([('', '')])
    r = requests.get(url)
    page = r.text
    soup = BeautifulSoup(page, "html5lib")
    print('Processing: {0}'.format(url))
    for p in soup.findAll('p'):
        dates.append(DATE_EXPRESSION.findall(p.text))

print(u'\n'.join([unicode(d[0]) for d in dates if len(d) > 0]))