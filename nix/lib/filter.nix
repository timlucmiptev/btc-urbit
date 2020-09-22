rec {
  # A filter for removing packages that aren't supported on the current platform
  # according to 'meta.platforms'.
  platformFilterGeneric = lib: system:
    # This needs to use the correct nixpkgs version so all the systems line up
    let
      platform = lib.systems.elaborate { inherit system; };
    # Can't just default to [] for platforms, since no meta.platforms
    # means "all platforms" not "no platforms"
    in drv : if drv ? meta && drv.meta ? platforms then
      lib.any (lib.meta.platformMatch platform) drv.meta.platforms
    else true;

  # A version of 'filterAttrsRecursive' that doesn't recurse into
  # derivations. This prevents us from going into an infinite loop
  # with the 'out' attribute on derivations.  TODO: Surely this
  # shouldn't be necessary. I think normal 'filterAttrsRecursive' will
  # effectively cause infinite loops if you keep derivations and your
  # predicate forces the value of the attribute, as this then triggers
  # a loop on the 'out' attribute. Weird.
  filterAttrsOnlyRecursive = lib: pred: set:
    lib.listToAttrs (
      lib.concatMap (name:
        let v = set.${name}; in
        if pred name v then [
          (lib.nameValuePair name (
            if builtins.isAttrs v && !lib.isDerivation v
              then filterAttrsOnlyRecursive pred v
              else v
          ))
        ] else []
      ) (builtins.attrNames set)
    );
}
