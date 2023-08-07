<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar class="row-xl row-lg row-md column-sm column-xs">
        <q-toolbar-title
          class="row-xl row-lg row-md column-sm column-xs q-pt-xs-sm q-pt-sm-sm q-pt-md-none q-pt-lg-none q-pt-xl-none items-center"
        >
          <div class="flex justify-center items-center">
            <img src="white.ico" style="height: 4rem; margin: 5px" />
            <div class="q-ml-sm text-h5">PolkaTax:</div>
          </div>
          <div class="q-ml-sm text-h5">A staking rewards calculator</div>
        </q-toolbar-title>
        <div>
          Price data provided by <a href="https://coingecko.com">CoinGecko</a>
        </div>
      </q-toolbar>
    </q-header>

    <q-footer reveal>
      <q-toolbar>
        <q-toolbar-title class="flex justify-end"
          ><a href="https://github.com/loanMaster/polkatax" class="flex"
            ><img src="img/github.png" /></a
        ></q-toolbar-title>
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
