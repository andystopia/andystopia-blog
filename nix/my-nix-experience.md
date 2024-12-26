---
title: My Nix Experience
author: andystopia
date: 2024-12-18
description: |
  The difficult parts of nix that 
  I felt either are an ecosystem
  sharp corners or things that didn't
  come intuitively to me.

lua-filter: filters/hello.lua
---

# The Nix Syntax

I'm going to preface this section with saying that 
I struggled to learn Nix, but now that I know it, 
I feel it is a really nice domain fit, and is a very 
friendly language for package management. 


This post reads a little tersely, but I do genuinely enjoy
using Nix, this is just terse, because I'm trying to aggregate
the scattered fragments of the nix ecosystem into one reference
manual for myself.


Without further ado..

## Intuition for the syntax

Where other langauges use curly braces to denote 
a sequence of statements, Nix uses it to define 
attribute sets, most like JSON. It took a bit of 
adjusting to this, as my brain seperates JSON 
from scripting languages and defaults curly 
braces to being ways to group statements, not attributes. 


### So how do we do sequential operations? 

Well, to some extent, you don't really need to 
do this with Nix, the language is pure for the most 
part and the way to define variables is to 
say 

```nix
let 
  x = 3; 
in 
  { 
    x-squared = x * x;
  }
```

A very mathy-haskelly way of writing syntax

### Beware the array


While other languages use commas to seperate
elements of an array, the Nix langauge does not, 
it uses the space. Naturally it also uses a space
for the function calls,  but the diference is as follows:

```nix
[a b]
``` 
^^  A list containing the values `a` and `b`

```nix
[(a b)]
``` 
^^ a list containing the function `a` applied to argument `b`


#### The Space Bites Sometimes! 

While the above may seem relatively tame, where this can 
really bite is when you try to override a package attribute or 
input and it just doesn't work, and the error message is incomprehensible, 
because the nix file contains:

```nix
buidInputs = [myPackage.override {necessaryOption = true;}]
```

This parses as two packages, the second of which is `{necessaryOption = true;}`

the fix is like shown above:
```nix
buidInputs = [(myPackage.override {necessaryOption = true;})]
```

this also applies to `overrideAttrs`, and it's bitten me a few times
and I wish there was an informative warning about this, but alas. 

# Summarizing the language.

Nix feels kind of like JSON had a baby with Haskell in order to permit 
some scripting without some atrocious JSON syntax.

# Linking

You're either going to have to know how linking works to 
some extent, or like me, you're going to learn some things about
how to patch up linking.

On macos there's `install_name_tool`, which a search of github
for nix files should illuminate the usage of. 

And on that note:

## Github Global Search


Nix is such a varied language with so many ways of doing things, that you're
probably going to need some examples, which are hard to find in the ecosystem.

Here [github global search](https://github.com/search) can illuminate examples, search
for `file:*.nix`, and search for the concept you're looking for and there's most 
likely an example

# Docker

If you use Nix in Docker, you might get an error like: `unable to load seccomp BDF program`,
this is not a Docker error, though it may look like it, you need to put 

```
sandbox = false
filter-syscalls = false 
```

in your nix.conf file within the docker container. Do I know why this is? No. I don't. I just
know this fixes that problem. More info available at: [#896](https://github.com/DeterminateSystems/nix-installer/issues/896).

## Docker NixOS is NOT NixOS

Yeah, the image is called NixOS, or at least it was, the last time I used it. 
It's not NixOS, I forget which OS it is, but it's some stripped down Linux distribution
with Nix installed, but it is not NixOS, so full system configuration is not happening, 
flakes and more imperative natures are the way to go.

## Building Docker Images With Nix

### Problems with too many layers

I have had some struggles with docker images getting too many layers with 
Nix, but the [nix2container](https://github.com/nlewo/nix2container) flake 
can allievate this nicely compared to the builtin solutions for building 
nix powered docker containers.

# Stabilizing Flakes.

If you have tried using flakes and making them build on a variety of systems, the 
tedium that is shown in the [nix go templates](https://github.com/NixOS/templates/blob/master/go-hello/flake.nix), 
illuminates some of the complexity. 

You may have come across the post by ayats, called [*Why you don't need flake-utils*](https://ayats.org/blog/no-flake-utils), which 
builds an excellent argument for why flake-utils can shoot you in the foot subtly. Instead of 
using that, I recommend using [flake parts](https://github.com/hercules-ci/flake-parts), which has
much better types and error messages, it's hard to make it fail wrong silently.

Get started with:

```nix
nix flake init -t github:hercules-ci/flake-parts --refresh
```

This will put a new flake part in your system, now you can add
 a 

```nix
devShells.default = pkgs.mkShell { 
  buildInuts = with pkgs; [
    # your nix packages here
  ]
}
```

into the `perSystem` part of the file, and it will simplify writing
flakes immensely


# Prefer Building From Source

*Gasp*. Building from source especially 
for certain langauges can be difficult to make work at times, 
but Nix often has excellent language support, if you google Nix 
followed by the langauge name, for instance R or Haskell, the 
documentation for how to manage that language's dependencies is 
more-often-than-not, excellent.

the reason to build from source however, is that once it works
it's usually pretty-straightforward to continue using 
across updates, while it can be much more technical to make 
work if you're patching up linking paths in binaries.  

TLDR: Building from source with Nix requires about the same
amount of knowledge as pulling down pre-compiled blobs, but 
does not require knowledge or debugging of binary patching.

## You're bound to have missing files.

At times, you will be trying to build and you will be notified
that a file is missing, this is probably due to an unmet dependency, and it 
is not clear what dependency these files are always from, for this use
case the [nix-index](https://github.com/nix-community/nix-index) program
can be immensely useful for figuring out what is missing and how to satisfy the 
dependency. Of course, google search can improve the situation, and knowing the
package ecosystem and which packages are more fundamental to the ecosystem compared
to others is helpful, but not required, and is a skill. 

## Check build outside of Docker.

If you're lucky enough to be on a system which can both run Nix and 
compile the host program, ensuring the build runs on the host machine 
can save a lot of debugging time compared to docker, as caching happens 
out of the box on your host machine with Nix, but does not happen out 
of the box with docker. So build first outside, then build for reals inside
the docker container. 


## Problems building from source.

You're going to need to know how Nix builds derivations, and 
I found reading [the manual](https://nixos.org/manual/nixos/stable/) was the most useful way 
to learn how to do that:




# Link Aggregates




| task | link | 
| --- | --- | 
| **NixOS Manual** | https://nixos.org/manual/nixos/stable/ | 
| **Nixpkgs Manual** | https://nixos.org/manual/nixpkgs/stable/ | 
| **The Wiki** | https://wiki.nixos.org/| 
| **Nix Flakes Wiki** | https://wiki.nixos.org/wiki/Flakes| 
| **Nix Flake Templates** | https://github.com/NixOS/templates | 
| **fasterthanlime** <br> Building A Rust Service with Nix |  https://fasterthanli.me/series/building-a-rust-service-with-nix  | 
| **Github Search** <br> Github Global Search |  https://github.com/search | 
| **Nix Index** <br> Search for missing files from dependencies|  https://fasterthanli.me/series/building-a-rust-service-with-nix  | 
| **Nix Search** <br> Search the Nix ecosystem|  https://search.nixos.org  | 
| **Nix Search CLI** <br> search.nixos.org CLI |  https://github.com/peterldowns/nix-search-cli | 
| **Lazamar** <br> Search for package versions within the nixpkgs | https://lazamar.co.uk/nix-versions/ |
| **Nixhub** <br> Search for package versions within the nixpkgs, seemingly more updated than lazamar | https://www.nixhub.io/ |
| **nix2container** <br> Quickly convert Nix derivation outputs to OCI images| https://github.com/nlewo/nix2container |
| **flake parts** <br> Flake which makes creating flakes easier | https://github.com/hercules-ci/flake-parts | 
| **flake parts docs** <br> Flake parts docs | https://flake.parts | 
