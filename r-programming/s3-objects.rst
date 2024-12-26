:Authors: by @andystopia
:title: S3 Class System 
:date: 2024-12-20

:description: R's S3 classes from the ground up.




-----------------------------------------------
An R Without S3:  
-----------------------------------------------



What Does R Mean By Class?
==========================

**class**
    The class of a variable dictates what operations are 
    possible for that variable. 
    
    For instance the ``numeric`` class 
    can be added / multiplied, divided etc. The ``character`` class
    can be concatenated, have parts replaced, etc. 
    
    Classes structure
    variables so that operations can be defined on them, but 
    classes are not the set of operations themself. 
    


Printing is complicated!   
============================

Let's say that we're creating R, and we start out with a 
very simple language. So far, the only classes 
are ``numeric`` and ``data.frame``. It'd sure be nice to see them, so 
we write a ``print_numeric`` and a ``print_data_frame`` function.

If we print a variable using 
the wrong ``print`` method, (i.e. ``print_data_frame(3)``), 
then we get all sorts of errors. *What is to be done?*

Let's say that a variable exists, of currently unknown class. 
With a growing number of classes, guessing the correct print function is 
going to become more challenging.  A variable's class can be found using the ``class`` function, 
such that the ``class(x)`` returns the class of the variable ``x``.
Once we know the class, then we'll know whether ``print_numeric`` or ``print_data_frame`` 
can be called.

*Crisis Averted. Right?*
 
Yeah. Kinda. This does work, but basically we're doing two steps, 
every time we want to print: 

1. We determine which class a variable is.
2. We determine which print function to call based off
   of that class. 


However, R already *knows* the  answer to 1, 
but we have to do a manual, mental translation from our 
result of 1, to determine what function we should call in Step 2.

*We're doing work that R could be doing*.

Simplifying Printing.
----------------------

**Goal**: Make R call the correct function based 
off of the class of the variable that we pass to ``print``.

We already have a pattern for naming our ``print`` functions. For a given class ``XXX``
we call ``print_XXX`` (i.e. ``print_numeric`` or ``print_data_frame``). 
In this case, some string operations can be used to determine 
which function should be called. 

Letting R know that ``print`` cares about class
------------------------------------------------

The way we have set up this system, each print function name
has the name of class it intends to print. Let's make a small
notation tweak to let R know it should be aware
of the class name contained within the function name.

Underscores in method names are
natural replacements for spaces, and we'd
like to keep using them for that purpose, so let's choose
the ``.`` character as a special syntax to let R know that
what comes after after the dot is a type and not just part of the function name.
To make our print functions follow the pattern we've created
(``print.XXX``), we rename the functions ``print_numeric`` 
and ``print_data_frame`` into ``print.numeric`` 
and ``print.data.frame`` respectively.

In short, what we want to do is:

1. Call ``print(x)``
2. and then ``print(x)`` should: 

   a. let XXX represent ``class(x)``
   b. call ``print.XXX(x)``


Step 2 is called *specialization*.

*specialization*
    Delegating the call of a function to a more specific function based on 
    an argument's class is called *specialization* and is the cornerstone of S3.


To indicate to R
to do step 2, there is the special function called :rdoc:`UseMethod`.
 
Indicating To R That We Want To Specialize.
===========================================
What is R's definition of :rdoc:`print`? 


.. code:: R

    print <- function (x, ...)  {
         UseMethod("print")
    }

Very brief. It's a bit opaque though, and instead
of leaning into the nitty-gritty, let's embrace the opaqueness, and 
rewrite what this is saying in English. "``print`` is a function
which takes an argument ``x`` and 
then calls ``print.XXX`` where ``XXX`` is the class of ``x``".

This is all that's needed. This is S3, in 
both essence and elegance. Our print function will now call
``print.data.frame`` and ``print.numeric`` depending on the 
class of variable passed to ``print``.

Case Study: How About :rdoc:`summary`:
=======================================

What's the R definition of :rdoc:`summary`?


.. code:: R 

    summary <- function (x, ...)  {
        UseMethod("summary")
    }


We see the same pattern as ``print`` :)

Benefits
===================

``print`` can now be called on our classes
and R will automatically determine the specific variant of print 
function which should be called. S3 makes our 
implementation of ``print`` modular and extensible. 
Every class' print function is in it's own neat function, 
and future users can determine how they want their 
classes printed.

Fallbacks
==========

If we call :rdoc:`print` or :rdoc:`summary` 
with an class that doesn't have a specialization for them, 
the definitions provided above will not suffice to do 
anything useful ever, so R instead delegates as if the 
variable was of class ``default``. For example, ``print.default``,
and ``summary.default`` are called, if no specializations are found. Code 
authors are free to define these two specializations for their 
own S3 functions, and indeed, R has already defined ``default`` specialization for both 
``print`` and ``summary``. 

The purpose of the ``default`` class is to provide 
a default specialization when no other specializations exist. This 
allows for error handling / an operation so general 
that it applies to variables of any class.


Commonly Used S3 Functions
==========================

- :rdoc:`print`

  **fan-favorite specializations**: 
  ``print.data.frame``, for already discussed reasons, and ``print.htest``, which give
  ``t.test`` and ``chisq.test`` their outputs
  despite being different tests.

- :rdoc:`as.data.frame`

  This one is hard to read because :rdoc:`data.frame` has a dot in it, so the S3
  specializations are things like ``as.data.frame.matrix``, where
  matrix is the class of the variable that we're converting from. It's 
  consistent, but a little confusing.

- :rdoc:`predict`



My Personal First S3 Class: Confidence Intervals
===========================================================================================

When I was a newbie Statistics Student, in my first
statistics class we were using R, and as all good
statistics classes learn, confidence intervals are
everywhere in this field. I noticed that R didn't have something
built-in
for displaying confidence intervals.

Now, obviously, I could create a list like :R:`list(lower = 3.0, upper = 4.0)`,
but if we print this in a :rdoc:`data.frame`, this is kind of verbose;
besides, many answers want either a radius form (like 2.0 +- 1.0) or 
interval form (like [2.0, 3.0]). 

Implementing a Confidence Interval Class
----------------------------------------

There are a few key observations to make. 

- The S3 function
  which converts arbitrary classes to :rdoc:`character` strings is called :rdoc:`toString`.
- :rdoc:`class` is not 
  just readonly, we can write into it as well.



..  code:: R

    # define a confidence interval
    conf_interval <- list(center = 3.0, radius = 1.0)
    # give it a class of `ci`
    class(conf_interval) <- "ci"

    # specialize toString for CI's
    toString.ci <- function(ci, radius_form = FALSE) {
        # define how to convert the 
        # ci class instance to a string
        if (radius_form) {
            paste0(ci$center, " +- ", ci$radius)
        } else {
            paste0(
                "[", 
                ci$center - ci$radius, 
                ", ", 
                ci$center + ci$radius, 
                "]"
            )
        }
    }

    # specialize print for CI's 
    print.ci <- function(ci, radius_form = FALSE) {
         # in this case, we get the special 
        # privilege that printing our CI can
        # be defined in terms of converting it to
        # a string first, and printing that
        print(toString(ci, radius_form = radius_form))
    }

    # Now we can use R's print function
    # and yet, still get special treatment for CIs
    print(conf_interval) # prints -> [1] [2.0, 4.0] 
    print(conf_interval, radius_form = TRUE) # prints -> [1] 3.0 +- 1.0 



And we have satisfied the behavior we were after.

Advanced S3 For People Who Want To Write Less Code. 
=============================================================

This section is dedicated to eeking out the last niceties of S3. 

Avoid Having To Assign To Class
---------------------------------

To avoid having to assign to ``class`` in a different step, we
can use :rdoc:`structure`.

.. code:: R

    conf_int <- structure(
        list(
            center = 3.0, 
            radius = 1.0
        ), 
        class = "ci"
     )

Which, fundamentally, does the same thing as my code above, 
just in one expression instead of 2.

Simplify Creating Instances.
----------------------------


.. code:: R

    create_ci <- function(center, radius) {
        new_ci <- list(center = center, radius = radius)
        class(new_ci) <- "ci"
        return(new_ci)
    }

    # now CI's can be created using...
    conf_interval <- create_ci(3.0, 1.0)

    # ... instead of
    conf_interval <- list(center = 3.0, radius = 1.0)
    class(conf_interval) <- "ci"

This specific pattern of shortening 
creating an instance of a class is called a ``constructor``.

**constructor**
    A function which returns a new instance 
    of a class. 


Constructors are useful for error handling, 
you can verify that radius is non-negative for instance,
and then rely on that in the future, by erroring gracefully 
in the constructor. 



.. _datatype: https://en.wikipedia.org/wiki/Data_type

