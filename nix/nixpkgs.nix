let

  sources = import ./sources.nix;
  nixpkgs = import sources.nixpkgs {};

in

nixpkgs // { inherit sources; }
